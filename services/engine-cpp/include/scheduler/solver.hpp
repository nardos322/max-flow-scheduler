#pragma once

#include <string>
#include <vector>

namespace scheduler {

struct Assignment {
  std::string doctor_id;
  std::string day_id;
  std::string period_id;
};

struct SolveResult {
  bool is_feasible;
  int assigned_count;
  std::vector<std::string> uncovered_days;
  std::vector<Assignment> assignments;
  std::string contract_version;
};

SolveResult Solve(const std::string& input_json);

}  // namespace scheduler
