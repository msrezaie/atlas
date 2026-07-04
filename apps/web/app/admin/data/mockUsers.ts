export type UserRole = "Admin" | "Moderator" | "Player";
export type UserStatus = "Active" | "Suspended" | "Invited";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  games: number;
  best: number;
  status: UserStatus;
  joined: string;
} & Record<string, unknown>;

export const MOCK_USERS: AdminUserRow[] = [
  {
    id: "u1",
    name: "Priya Natarajan",
    email: "priya.n@atlasgame.io",
    role: "Admin",
    games: 412,
    best: 9800,
    status: "Active",
    joined: "2024-02-11",
  },
  {
    id: "u2",
    name: "Marcus Webb",
    email: "marcus.webb@atlasgame.io",
    role: "Moderator",
    games: 288,
    best: 8420,
    status: "Active",
    joined: "2024-05-03",
  },
  {
    id: "u3",
    name: "Elena Kowalska",
    email: "elena.k@gmail.com",
    role: "Player",
    games: 96,
    best: 6150,
    status: "Active",
    joined: "2025-01-19",
  },
  {
    id: "u4",
    name: "Diego Fernandez",
    email: "diego.fdz@outlook.com",
    role: "Player",
    games: 54,
    best: 4980,
    status: "Suspended",
    joined: "2024-11-27",
  },
  {
    id: "u5",
    name: "Amara Okafor",
    email: "amara.okafor@atlasgame.io",
    role: "Moderator",
    games: 201,
    best: 7660,
    status: "Active",
    joined: "2024-07-14",
  },
  {
    id: "u6",
    name: "Sofia Lindqvist",
    email: "sofia.l@gmail.com",
    role: "Player",
    games: 12,
    best: 2340,
    status: "Invited",
    joined: "2026-06-28",
  },
  {
    id: "u7",
    name: "Kenji Watanabe",
    email: "kenji.w@yahoo.co.jp",
    role: "Player",
    games: 167,
    best: 8890,
    status: "Active",
    joined: "2024-09-02",
  },
  {
    id: "u8",
    name: "Hannah Brooks",
    email: "hannah.brooks@atlasgame.io",
    role: "Player",
    games: 3,
    best: 890,
    status: "Invited",
    joined: "2026-07-01",
  },
];
