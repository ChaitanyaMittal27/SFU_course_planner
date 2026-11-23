import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ push: vi.fn(), getDepartments: vi.fn(), getCourses: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("next/link", () => ({ default: ({ href, children, ...props }: React.ComponentProps<"a">) => <a href={href} {...props}>{children}</a> }));
vi.mock("@/lib/api", () => ({ api: { getDepartments: mocks.getDepartments, getCourses: mocks.getCourses } }));

import NotFound from "@/app/not-found";

const department = { deptId: 14, deptCode: "CMPT", name: "Computing Science" };
const course = { courseId: 3998, deptId: 14, courseNumber: "225", title: "Data Structures", description: null, units: 3, degreeLevel: "UGRD", prerequisites: null, corequisites: null, designation: null };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getDepartments.mockResolvedValue([department]);
  mocks.getCourses.mockResolvedValue([course]);
});

describe("404 page", () => {
  it("shows the generic not-offered copy", () => {
    render(<NotFound />);
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "This page isn't offered this term." })).toBeInTheDocument();
    expect(screen.getByText("Or any term, really. Even the waitlist is empty.")).toBeInTheDocument();
    expect(screen.queryByText(/course link is invalid/)).not.toBeInTheDocument();
    expect(document.querySelector("main")).toBeNull();
  });

  it("lists the page as a course row that isn't offered", () => {
    render(<NotFound />);
    const table = screen.getByRole("table", { name: "This page as a course offering" });
    expect(within(table).getAllByRole("columnheader").map((th) => th.textContent)).toEqual(["Section", "Title", "Seats", "Status"]);
    const row = within(table).getAllByRole("row")[1];
    expect(row).toHaveTextContent("PAGE 404");
    expect(row).toHaveTextContent("Page Not Found");
    expect(row).toHaveTextContent("0 / 0");
    expect(within(row).getByText("Not offered")).toHaveClass("text-destructive-text");
  });

  it("offers the course search and links to Browse and home", async () => {
    const user = userEvent.setup();
    render(<NotFound />);
    expect(screen.getByRole("link", { name: "Browse courses" })).toHaveAttribute("href", "/browse");
    expect(screen.getByRole("link", { name: "Go home" })).toHaveAttribute("href", "/");

    const search = screen.getByRole("combobox", { name: "What were you looking for?" });
    await waitFor(() => expect(search).toBeEnabled());
    await user.type(search, "cmpt 225");
    await screen.findByRole("option", { name: /CMPT 225/ });
    await user.keyboard("{Enter}");
    expect(mocks.push).toHaveBeenCalledWith("/browse/cmpt/225");
  });
});
