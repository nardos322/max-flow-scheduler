cmake_minimum_required(VERSION 3.20)
project(scheduler_engine LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

add_library(solver_lib
  src/solver.cpp
  src/flow_network.cpp
  src/problem_input.cpp
  src/graph_builder.cpp
  src/assignment_extractor.cpp
)
target_include_directories(solver_lib
  PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}/include
  PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/third_party
)

add_executable(scheduler_engine src/main.cpp)
target_include_directories(scheduler_engine PRIVATE
  ${CMAKE_CURRENT_SOURCE_DIR}/third_party
)
target_link_libraries(scheduler_engine PRIVATE solver_lib)

include(CTest)
if(BUILD_TESTING)
  option(SCHEDULER_FETCH_GTEST "Download googletest when not available on the system" OFF)
  find_package(GTest QUIET)

  if(NOT GTest_FOUND AND SCHEDULER_FETCH_GTEST)
    include(FetchContent)
    FetchContent_Declare(
      googletest
      URL https://github.com/google/googletest/archive/refs/tags/v1.14.0.tar.gz
      DOWNLOAD_EXTRACT_TIMESTAMP TRUE
    )
    # Keep parent compiler/runtime settings in test dependencies.
    set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
    FetchContent_MakeAvailable(googletest)
  endif()

  if(GTest_FOUND OR TARGET GTest::gtest_main)
    add_executable(solver_tests tests/solver_test.cpp)
    target_link_libraries(solver_tests PRIVATE GTest::gtest_main solver_lib)
    target_compile_definitions(solver_tests PRIVATE
      DOMAIN_FIXTURES_DIR="${CMAKE_CURRENT_SOURCE_DIR}/../../packages/domain/fixtures"
    )

    include(GoogleTest)
    gtest_discover_tests(solver_tests)
  else()
    message(STATUS "GTest unavailable. Install system gtest or configure with -DSCHEDULER_FETCH_GTEST=ON.")
  endif()
endif()
