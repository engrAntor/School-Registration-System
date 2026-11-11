import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ==============================================================================
// Custom Performance & Integrity Metrics
// ==============================================================================
const successfulHolds = new Counter('successful_seat_holds');
const conflictHolds = new Counter('conflict_seat_holds');
const failedRequests = new Counter('failed_unexpected_requests');
const seatHoldSuccessRate = new Rate('seat_hold_success_rate');
const holdResponseTime = new Trend('hold_response_time_ms');

// ==============================================================================
// Configuration Options (Load Profile)
// ==============================================================================
export const options = {
  scenarios: {
    // 1. Warm-up & Class browsing traffic
    browse_classes: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
      exec: 'browseClassesScenario',
    },
    // 2. High-Stress Concurrent Seat Hold Rush (Simulating high demand opening)
    concurrent_seat_rush: {
      executor: 'ramping-vus',
      startVUs: 5,
      stages: [
        { duration: '10s', target: 50 },  // Ramp-up to 50 concurrent VUs
        { duration: '20s', target: 100 }, // Spike to 100 concurrent VUs
        { duration: '10s', target: 0 },   // Graceful ramp-down
      ],
      startTime: '5s',
      exec: 'seatRushScenario',
    },
  },
  thresholds: {
    // Over 95% of requests should complete within 350ms
    http_req_duration: ['p(95)<350'],
    // System must maintain 0 unexpected 500 errors
    'failed_unexpected_requests': ['count==0'],
  },
};

// Target backend URL (Defaults to Dockerized port 8081 or 8080)
const BASE_URL = __ENV.TARGET_URL || 'http://localhost:8081';

// Setup phase: Runs once before VU execution to create target classes
export function setup() {
  console.log(`[k6 Setup] Target API: ${BASE_URL}`);

  // Create a limited-seat test class for race condition evaluation
  const payload = JSON.stringify({
    name: `Load Test Class - Limited (${Date.now()})`,
    totalSeats: 25,
  });

  const headers = { 'Content-Type': 'application/json' };
  const res = http.post(`${BASE_URL}/classes`, payload, { headers });

  if (res.status !== 201) {
    throw new Error(`Failed setup: POST /classes returned status ${res.status}. Output: ${res.body}`);
  }

  const createdClass = JSON.parse(res.body);
  console.log(`[k6 Setup] Created Test Class: ${createdClass.id} with ${createdClass.totalSeats} seats.`);

  return {
    classId: createdClass.id,
    totalSeats: createdClass.totalSeats,
  };
}

// ==============================================================================
// Scenario 1: Browse Classes & Poll Seat Availability
// ==============================================================================
export function browseClassesScenario() {
  const res = http.get(`${BASE_URL}/classes`);

  check(res, {
    'GET /classes status is 200': (r) => r.status === 200,
    'GET /classes returns array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body);
      } catch {
        return false;
      }
    },
  });

  sleep(1);
}

// ==============================================================================
// Scenario 2: Concurrent Seat Hold Rush (Race Condition & Lock Test)
// ==============================================================================
export function seatRushScenario(data) {
  // Generate a unique 17-digit student BRN for this virtual user and iteration
  // Ensures student invariant: 1 active hold per student
  const studentBrn = String(20050000000000000 + (__VU * 100000) + __ITER).slice(0, 17);

  const url = `${BASE_URL}/classes/${data.classId}/holds`;
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-Student-Id': studentBrn,
    },
  };

  const startTime = Date.now();
  const res = http.post(url, null, params);
  holdResponseTime.add(Date.now() - startTime);

  if (res.status === 201) {
    // Successfully acquired a held seat
    successfulHolds.add(1);
    seatHoldSuccessRate.add(1);

    const holdData = JSON.parse(res.body);
    check(res, {
      'Hold status is HELD': () => holdData.status === 'HELD',
      'Hold has valid expiresAt': () => holdData.expiresAt !== undefined,
    });
  } else if (res.status === 409) {
    // Cleanly rejected because seats are exhausted or student already has active hold
    conflictHolds.add(1);
    seatHoldSuccessRate.add(0);

    check(res, {
      'Conflict is expected 409': (r) => r.status === 409,
    });
  } else {
    // Any other response (especially 500) indicates an issue
    failedRequests.add(1);
    console.error(`[k6 Error] Unexpected status ${res.status}: ${res.body}`);
  }

  // Brief pacing sleep between attempts
  sleep(0.5);
}

// Teardown phase: Runs once after test execution to verify integrity
export function teardown(data) {
  console.log(`[k6 Teardown] Verifying final state for class ${data.classId}...`);
  const res = http.get(`${BASE_URL}/classes/${data.classId}`);

  if (res.status === 200) {
    const classInfo = JSON.parse(res.body);
    console.log(`--------------------------------------------------`);
    console.log(`Total Seats:     ${classInfo.totalSeats}`);
    console.log(`Held Seats:      ${classInfo.heldSeats}`);
    console.log(`Confirmed Seats: ${classInfo.confirmedSeats}`);
    console.log(`Available Seats: ${classInfo.availableSeats}`);
    console.log(`--------------------------------------------------`);

    if (classInfo.heldSeats + classInfo.confirmedSeats > classInfo.totalSeats) {
      console.error(`[CRITICAL ERROR] Oversold! Total allocated exceeds totalSeats!`);
    } else {
      console.log(`[PASS] Concurrency check: Allocated seats <= Total Seats.`);
    }
  }
}

