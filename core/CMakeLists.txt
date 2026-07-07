cmake_minimum_required(VERSION 3.15)
project(ccims VERSION 1.0 LANGUAGES CXX C)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED True)

# Extern SQLite3
add_library(sqlite3 STATIC extern/sqlite3.c)
target_include_directories(sqlite3 PUBLIC extern)

# Include directories
include_directories(
    include
    extern
)

add_library(ccims_core STATIC
    src/engines/RewardEngine.cpp
    src/engines/StatementEngine.cpp
    src/engines/LoungeEngine.cpp
    src/engines/AnalyticsEngine.cpp
    src/engines/TransactionManager.cpp
    src/storage/SQLiteStorage.cpp
    src/storage/JsonConfigLoader.cpp
)

target_link_libraries(ccims_core PUBLIC sqlite3)

# CLI Executable
add_executable(ccims_cli cli/main.cpp)
target_link_libraries(ccims_cli PRIVATE ccims_core sqlite3)

# Test Executable (dummy for now)
# add_executable(ccims_tests tests/main.cpp)
# target_link_libraries(ccims_tests PRIVATE ccims_core)
