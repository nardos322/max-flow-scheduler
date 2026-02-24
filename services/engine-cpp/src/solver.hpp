#pragma once

#include <string>

namespace scheduler {

struct SolveResult {
  bool is_feasible;
  int assigned_count;
};

// Placeholder solver for stage 1 bootstrap.
SolveResult Solve(const std::string& input_json);

}  // namespace scheduler
