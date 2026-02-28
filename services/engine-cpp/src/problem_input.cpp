#include <scheduler/problem_input.hpp>
#include <nlohmann/json.hpp>

namespace scheduler {

ProblemInput ParseProblemInput(const std::string& input_json) {
  const nlohmann::json root = nlohmann::json::parse(input_json);
  ProblemInput problem;

  if (root.contains("contractVersion") && root["contractVersion"].is_string()) {
    problem.contract_version = root["contractVersion"].get<std::string>();
  }

  for (const auto& doctor : root.at("doctors")) {
    problem.doctors.push_back(Doctor{
        doctor.at("id").get<std::string>(),
        doctor.at("maxTotalDays").get<int>(),
    });
  }

  for (const auto& period : root.at("periods")) {
    problem.periods.push_back(Period{
        period.at("id").get<std::string>(),
        period.at("dayIds").get<std::vector<std::string>>(),
    });
  }

  for (const auto& demand : root.at("demands")) {
    problem.demands.push_back(Demand{
        demand.at("dayId").get<std::string>(),
        demand.at("requiredDoctors").get<int>(),
    });
  }

  for (const auto& item : root.at("availability")) {
    problem.availability.push_back(Availability{
        item.at("doctorId").get<std::string>(),
        item.at("periodId").get<std::string>(),
        item.at("dayId").get<std::string>(),
    });
  }

  return problem;
}

}  // namespace scheduler
