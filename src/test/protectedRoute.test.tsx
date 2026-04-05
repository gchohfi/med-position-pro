import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import React from "react";

/**
 * Tests for ProtectedRoute behavior.
 * We mock AuthContext to simulate different auth states.
 */

// Mock the AuthContext module
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

// Import after mock
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

const mockedUseAuth = vi.mocked(useAuth);

function renderWithRouter(authState: { user: unknown; loading: boolean }, initialRoute = "/protected") {
  mockedUseAuth.mockReturnValue({
    user: authState.user as any,
    session: null,
    loading: authState.loading,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  });

  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/auth" element={<div data-testid="auth-page">Login</div>} />
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <div data-testid="protected-content">Secret Content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  it("shows loading spinner while auth is loading", () => {
    renderWithRouter({ user: null, loading: true });
    // Should not show protected content or auth page
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
    expect(screen.queryByTestId("auth-page")).not.toBeInTheDocument();
  });

  it("redirects to /auth when user is not authenticated", () => {
    renderWithRouter({ user: null, loading: false });
    expect(screen.getByTestId("auth-page")).toBeInTheDocument();
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  it("renders children when user is authenticated", () => {
    renderWithRouter({ user: { id: "user-123", email: "test@test.com" }, loading: false });
    expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    expect(screen.queryByTestId("auth-page")).not.toBeInTheDocument();
  });

  it("shows protected content text correctly", () => {
    renderWithRouter({ user: { id: "user-123" }, loading: false });
    expect(screen.getByText("Secret Content")).toBeInTheDocument();
  });
});
