#include <gtest/gtest.h>
#include <fstream>
#include <sstream>
#include <stdexcept>
#include <string>
#include <unordered_set>
#include <scheduler/solver.hpp>

namespace {

#ifndef DOMAIN_FIXTURES_DIR
#define DOMAIN_FIXTURES_DIR ""
#endif

std::string ReadFixtureFile(const std::string& file_name) {
  const std::string full_path = std::string(DOMAIN_FIXTURES_DIR) + "/" + file_name;
  std::ifstream stream(full_path);
  if (!stream.is_open()) {
    throw std::runtime_error("Unable to open fixture file: " + full_path);
  }

  std::ostringstream buffer;
  buffer << stream.rdbuf();
  return buffer.str();
}

TEST(SolverFlow, SolvesFeasibleScenarioFromSharedFixture) {
  const std::string input = ReadFixtureFile("happy.basic.request.json");

  const auto result = scheduler::Solve(input);

  EXPECT_TRUE(result.is_feasible);
  EXPECT_EQ(result.assigned_count, 2);
  EXPECT_TRUE(result.uncovered_days.empty());
  EXPECT_EQ(result.assignments.size(), 2);

  std::unordered_set<std::string> assigned_days;
  for (const auto& assignment : result.assignments) {
    assigned_days.insert(assignment.day_id);
  }

  EXPECT_TRUE(assigned_days.find("day-1") != assigned_days.end());
  EXPECT_TRUE(assigned_days.find("day-2") != assigned_days.end());
}

TEST(SolverFlow, DetectsOneDayPerPeriodInfeasibilityFromSharedFixture) {
  const std::string input = ReadFixtureFile("infeasible.request.json");

  const auto result = scheduler::Solve(input);

  EXPECT_FALSE(result.is_feasible);
  EXPECT_EQ(result.assigned_count, 1);
  EXPECT_EQ(result.assignments.size(), 1);
  EXPECT_EQ(result.uncovered_days.size(), 1);
}

TEST(SolverFlow, DetectsCapacityShortage) {
  const std::string input = R"json(
  {
    "contractVersion": "1.0",
    "doctors": [
      { "id": "d1", "maxTotalDays": 1 }
    ],
    "periods": [
      { "id": "p1", "dayIds": ["day-1"] },
      { "id": "p2", "dayIds": ["day-2"] }
    ],
    "demands": [
      { "dayId": "day-1", "requiredDoctors": 1 },
      { "dayId": "day-2", "requiredDoctors": 1 }
    ],
    "availability": [
      { "doctorId": "d1", "periodId": "p1", "dayId": "day-1" },
      { "doctorId": "d1", "periodId": "p2", "dayId": "day-2" }
    ]
  }
  )json";

  const auto result = scheduler::Solve(input);

  EXPECT_FALSE(result.is_feasible);
  EXPECT_EQ(result.assigned_count, 1);
  EXPECT_EQ(result.uncovered_days.size(), 1);
}

TEST(SolverFlow, RejectsInvalidJsonPayload) {
  const auto result = scheduler::Solve("{invalid-json");

  EXPECT_FALSE(result.is_feasible);
  EXPECT_EQ(result.assigned_count, 0);
  EXPECT_TRUE(result.assignments.empty());
}

}  // namespace
