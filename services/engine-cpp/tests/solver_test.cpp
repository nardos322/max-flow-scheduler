#include <gtest/gtest.h>

#include "solver.hpp"

TEST(SolverBootstrap, ReturnsDefaultResult) {
  const auto result = scheduler::Solve("{}");
  EXPECT_FALSE(result.is_feasible);
  EXPECT_EQ(result.assigned_count, 0);
}
