#include <gtest/gtest.h>
#include <fstream>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>
#include <nlohmann/json.hpp>
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

struct FixtureExpectation {
  std::string id;
  std::string request_file;
  bool expect_schema_valid;
  bool has_expected_solver;
  bool expected_is_feasible;
  int expected_assigned_count;
  int expected_uncovered_days_count;
};

std::vector<FixtureExpectation> LoadFixtureCatalog() {
  const auto catalog_json = nlohmann::json::parse(ReadFixtureFile("catalog.json"));
  std::vector<FixtureExpectation> fixtures;

  for (const auto& item : catalog_json) {
    FixtureExpectation fixture{
      item.at("id").get<std::string>(),
      item.at("requestFile").get<std::string>(),
      item.at("expectSchemaValid").get<bool>(),
      item.contains("expectedSolver"),
      false,
      0,
      0
    };

    if (fixture.has_expected_solver) {
      const auto& expected = item.at("expectedSolver");
      fixture.expected_is_feasible = expected.at("isFeasible").get<bool>();
      fixture.expected_assigned_count = expected.at("assignedCount").get<int>();
      fixture.expected_uncovered_days_count = expected.at("uncoveredDaysCount").get<int>();
    }

    fixtures.push_back(fixture);
  }

  return fixtures;
}

TEST(SolverFlow, MatchesExpectedOutcomesFromSharedFixtureCatalog) {
  const auto fixtures = LoadFixtureCatalog();
  int validated_count = 0;

  for (const auto& fixture : fixtures) {
    if (!fixture.expect_schema_valid || !fixture.has_expected_solver) {
      continue;
    }

    SCOPED_TRACE(fixture.id);
    const auto result = scheduler::Solve(ReadFixtureFile(fixture.request_file));

    EXPECT_EQ(result.contract_version, "1.0");
    EXPECT_EQ(result.is_feasible, fixture.expected_is_feasible);
    EXPECT_EQ(result.assigned_count, fixture.expected_assigned_count);
    EXPECT_EQ(static_cast<int>(result.uncovered_days.size()), fixture.expected_uncovered_days_count);
    validated_count += 1;
  }

  EXPECT_GT(validated_count, 0);
}

TEST(SolverFlow, RejectsInvalidJsonPayload) {
  const auto result = scheduler::Solve("{invalid-json");

  EXPECT_FALSE(result.is_feasible);
  EXPECT_EQ(result.assigned_count, 0);
  EXPECT_TRUE(result.assignments.empty());
}

}  // namespace
