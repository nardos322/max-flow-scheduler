cmake_minimum_required(VERSION 3.20)
project(scheduler_engine LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_library(solver_lib src/solver.cpp)
target_include_directories(solver_lib PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/src)

add_executable(scheduler_engine src/main.cpp)
target_link_libraries(scheduler_engine PRIVATE solver_lib)

include(CTest)
if(BUILD_TESTING)
  find_package(GTest QUIET)
  if(GTest_FOUND)
    add_executable(solver_tests tests/solver_test.cpp)
    target_link_libraries(solver_tests PRIVATE GTest::gtest_main solver_lib)

    include(GoogleTest)
    gtest_discover_tests(solver_tests)
  else()
    message(STATUS "GTest not found. Skipping C++ tests in this environment.")
  endif()
endif()
