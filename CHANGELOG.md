# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [2.1.0] - 2025-01-02

### 🚀 Major Features
- **Smart Merge System v2**: Complete rewrite using ts-morph for more reliable AST manipulation
- **Advanced Import Management**: Intelligent import deduplication and organization with conflict resolution
- **Enhanced Decorator Strategy**: Improved decorator configuration system with better type safety
- **Performance Optimizations**: Faster generation with optimized file processing and caching

### ✨ Enhancements
- **TypeScript 5.8+ Support**: Full compatibility with latest TypeScript features
- **Extended Field Classifiers**: More precise field analysis and categorization
- **Modular Template System**: Refactored template helpers for better maintainability
- **Improved Error Handling**: Better error messages and debugging capabilities

### 🔧 Technical Improvements
- Enhanced AST-based code analysis and generation
- Intelligent import conflict resolution
- Better handling of complex TypeScript constructs
- Optimized performance with caching strategies
- Improved test coverage and reliability

### 📦 Dependencies
- Updated `@prisma/generator-helper` to v6.10.1
- Updated `@prisma/internals` to v6.10.1
- Updated `ts-morph` to v26.0.0
- Updated TypeScript to v5.8.3

### 🐛 Bug Fixes
- Fixed import deduplication issues in complex schemas
- Resolved decorator propagation problems
- Enhanced error recovery for malformed code
- Improved handling of edge cases in field classification

## [2.0.21] - 2024-12-15

### 🔧 Improvements
- Enhanced smart merge system reliability
- Better handling of custom decorators
- Improved import management
- Performance optimizations for large schemas

### 🐛 Bug Fixes
- Fixed issues with decorator config propagation
- Resolved field processing edge cases
- Enhanced stability of merge operations

## [2.0.2] - 2024-11-20

### 🎉 Major Release
- **Smart Merge System**: Automatically preserves custom fields and decorators during regeneration
- **Custom Decorator Config**: Define and use custom decorators with proper import mapping
- **Modular Architecture**: Complete refactoring for better maintainability and extensibility
- **Enhanced Performance**: Optimized generation process and import management
- **Better Type Safety**: Improved TypeScript interfaces and type checking

## [1.4.1] - 2021-10-08

- upgrades prisma dependencies to their latest 3.x versions

### Fixed

- Generated code imports using \ instead of / ([#10](https://github.com/vegardit/prisma-generator-nestjs-dto/issues/10))

## [1.4.0] - 2021-09-24

- upgrades prisma dependencies to their latest 3.x versions

## [1.3.1] - 2021-09-24

- applies available minor and patch updates to dependencies
