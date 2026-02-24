#include <iostream>
#include <sstream>
#include <string>

#include "solver.hpp"

int main() {
  std::stringstream buffer;
  buffer << std::cin.rdbuf();

  const auto result = scheduler::Solve(buffer.str());
  std::cout << "{\"isFeasible\":" << (result.is_feasible ? "true" : "false")
            << ",\"assignedCount\":" << result.assigned_count
            << ",\"uncoveredDays\":[],\"assignments\":[]}";

  return 0;
}
