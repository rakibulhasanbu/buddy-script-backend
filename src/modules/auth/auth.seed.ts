import bcrypt from "bcrypt";

import prisma from "@/lib/prisma";
import config from "@/config";

const firstNames = [
  "Avery",
  "Blake",
  "Cameron",
  "Drew",
  "Elliot",
  "Finley",
  "Gray",
  "Harper",
  "Indigo",
  "Jordan",
  "Kendall",
  "Logan",
  "Morgan",
  "Nico",
  "Oakley",
  "Parker",
  "Quinn",
  "Reese",
  "Sawyer",
  "Taylor",
  "Uma",
  "Val",
  "Wren",
  "Xen",
  "Yael",
  "Zion",
  "Alex",
  "Bailey",
  "Casey",
  "Dakota",
  "Eden",
  "Frankie",
  "Glenn",
  "Hayden",
  "Ira",
  "Jamie",
  "Kai",
  "Lennon",
  "Micah",
  "Noel",
  "Onyx",
  "Phoenix",
  "Remy",
  "Sage",
  "Tatum",
  "Umber",
  "Vesper",
  "Winter",
  "Xan",
  "Yuki",
  "Zane",
];

const lastNames = [
  "Anderson",
  "Brown",
  "Clark",
  "Davis",
  "Evans",
  "Foster",
  "Garcia",
  "Harris",
  "Irwin",
  "Jones",
  "King",
  "Lee",
  "Miller",
  "Nguyen",
  "Ortiz",
  "Patel",
  "Quinn",
  "Robinson",
  "Smith",
  "Taylor",
  "Underwood",
  "Vasquez",
  "Williams",
  "Xu",
  "Young",
  "Zhang",
  "Adams",
  "Baker",
  "Carter",
  "Diaz",
  "Edwards",
  "Flores",
  "Green",
  "Hall",
  "Ingram",
  "Jackson",
  "Kim",
  "Lewis",
  "Martin",
  "Nelson",
  "Owens",
  "Peterson",
  "Quintero",
  "Rivera",
  "Scott",
  "Thomas",
  "Upton",
  "Vargas",
  "Walker",
  "Yates",
];

const headlines = [
  "CEO of something",
  "Product Manager",
  "Software Engineer",
  "UX Designer",
  "Marketing Lead",
  "Data Scientist",
  "Founder",
  "CTO",
  "Operations Manager",
  "Content Strategist",
  "Sales Director",
  "HR Specialist",
  "DevOps Engineer",
  "Mobile Developer",
  "Community Manager",
  "Creative Director",
  "Research Analyst",
  "Project Manager",
  "Growth Hacker",
  "Customer Success",
];

const bios = [
  "Building things that matter.",
  "Coffee, code, and curiosity.",
  "Helping teams ship faster.",
  "Designing with empathy.",
  "Turning data into decisions.",
  "Startup enthusiast.",
  "Always learning.",
  "People-first leader.",
  "Open source contributor.",
  "Simplifying the complex.",
];

export const seedUsers = async () => {
  const password = await bcrypt.hash("12345678", Number(config.bcrypt_salt_rounds) || 12);

  const users = Array.from({ length: 50 }).map((_, index) => {
    const firstName = firstNames[index % firstNames.length];
    const lastName = lastNames[index % lastNames.length];
    const uniqueId = `${Date.now()}-${index}`;

    return {
      email: `demo${index + 1}.${uniqueId}@example.com`,
      password,
      firstName,
      lastName,
      headline: headlines[index % headlines.length],
      bio: bios[index % bios.length],
      photoUrl: `https://i.pravatar.cc/150?u=${index + 1}`,
    };
  });

  const result = await prisma.user.createMany({
    data: users,
    skipDuplicates: true,
  });

  return result;
};
