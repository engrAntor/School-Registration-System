using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
    public class SchoolClass
    {
        public string Id { get; private set; }
        public string Name { get; private set; }
        public int TotalSeats { get; private set; }
        public ICollection<Hold> Holds { get; private set; } = new List<Hold>();

        private SchoolClass()
        {
            Id = null!;
            Name = null!;
        }

        public SchoolClass(string id, string name, int totalSeats)
        {
            Id = id;
            Name = name;
            TotalSeats = totalSeats;
        }
    }
}
