#include <iostream>
#include <sstream>
#include <nlohmann/json.hpp>
#include <scheduler/solver.hpp>

int main() {
  std::stringstream buffer;
  buffer << std::cin.rdbuf();

  const auto result = scheduler::Solve(buffer.str());

  nlohmann::json output;
  output["contractVersion"] = result.contract_version;
  output["isFeasible"] = result.is_feasible;
  output["assignedCount"] = result.assigned_count;
  output["uncoveredDays"] = result.uncovered_days;

  output["assignments"] = nlohmann::json::array();
  for (const auto& assignment : result.assignments) {
    output["assignments"].push_back(
        {
            {"doctorId", assignment.doctor_id},
            {"dayId", assignment.day_id},
            {"periodId", assignment.period_id},
        });
  }

  std::cout << output.dump();
  return 0;
}
