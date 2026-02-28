#pragma once

#include <string>
#include <vector>

namespace scheduler {

struct Doctor {
  std::string id;
  int max_total_days = 0;
};

struct Period {
  std::string id;
  std::vector<std::string> day_ids;
};

struct Demand {
  std::string day_id;
  int required_doctors = 0;
};

struct Availability {
  std::string doctor_id;
  std::string period_id;
  std::string day_id;
};

struct ProblemInput {
  std::string contract_version = "1.0";
  std::vector<Doctor> doctors;
  std::vector<Period> periods;
  std::vector<Demand> demands;
  std::vector<Availability> availability;
};

ProblemInput ParseProblemInput(const std::string& input_json);

}  // namespace scheduler
