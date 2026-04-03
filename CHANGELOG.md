# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.13.3](https://github.com/habolanos/devsecops-process-tracker/compare/1.13.2...1.13.3) (2026-04-03)


### ⚡ Performance

* **docker:** optimize build with npm cache mount and .dockerignore ([88a9ee8](https://github.com/habolanos/devsecops-process-tracker/commit/88a9ee8fdd82d053ca34457ff39152461b409977))


### 👷 CI/CD

* **docker:** add GHCR login to attestation job ([da7e38d](https://github.com/habolanos/devsecops-process-tracker/commit/da7e38dc5b38b53516a940a05d99678e1b1b5e86))
* **docker:** publish to both Docker Hub and GHCR with attestation to GHCR ([7298b15](https://github.com/habolanos/devsecops-process-tracker/commit/7298b153109e502577f21daebb521aba0ae8b261))
* **docker:** remove push-to-registry for attestation - Docker Hub doesn't support it ([09e7265](https://github.com/habolanos/devsecops-process-tracker/commit/09e72652c5dfa75f60ad4deb75dce719f8f3c754))

## [1.13.2](https://github.com/habolanos/devsecops-process-tracker/compare/1.13.1...1.13.2) (2026-04-02)


### 🐛 Bug Fixes

* **docker:** simplify next.config for standalone output ([64746fe](https://github.com/habolanos/devsecops-process-tracker/commit/64746fe50d7c600086b0a7848ff475948523ebba))

## [1.0.1](https://github.com/habolanos/devsecops-process-tracker/compare/v1.0.0...v1.0.1) (2026-04-02)


### ♻️ Refactoring

* **ci:** release triggers after CI completes successfully ([ddb409a](https://github.com/habolanos/devsecops-process-tracker/commit/ddb409a3bafc765ff61e9ce9ecf5b53200c64613))

## 1.0.0 (2026-04-02)


### 🐛 Bug Fixes

* add missing type and checkItems properties to json-utils export/import ([11002af](https://github.com/habolanos/devsecops-process-tracker/commit/11002af854c1b47584a14b1118692a04672b8df6))
* Add to summit check it ([162a294](https://github.com/habolanos/devsecops-process-tracker/commit/162a294ae3c997125527986cb6c765f8e5033e50))
* **ci:** add conventional-changelog-conventionalcommits for semantic-release ([f8edcd1](https://github.com/habolanos/devsecops-process-tracker/commit/f8edcd1c72c1089d66465dcb325ac74feb4e83b5))
* **e2e:** all tests passing - cascade uncomplete, data-task-id selectors, progress-bar fixes ([8444da3](https://github.com/habolanos/devsecops-process-tracker/commit/8444da3bdcba3a32e753fe7ddefd49af3db6bac8))
* **e2e:** implement cascade uncomplete and fix test selectors ([892c132](https://github.com/habolanos/devsecops-process-tracker/commit/892c1324d2fc1bcc2cb61f61839addd77f9e708e))
* migrate ESLint to CLI and fix lint errors ([9778846](https://github.com/habolanos/devsecops-process-tracker/commit/97788467a8bf3458c16838780fbf62f60c2f4cae))


### ⚡ Performance

* update pipeline ci ([062a26f](https://github.com/habolanos/devsecops-process-tracker/commit/062a26fd73baa3cb63c35eabd332984d2e287686))


### 📚 Documentation

* documentación completa + diagramas arquitectura + fix vulnerabilidades ([8fc770b](https://github.com/habolanos/devsecops-process-tracker/commit/8fc770bb8a9dc154fd1a9a7f38187518ad7f88c5))
* **readme:** documentar ajustes CI/CD, tests, seguridad v1.13.1 ([47e49ca](https://github.com/habolanos/devsecops-process-tracker/commit/47e49ca4f2557192f14281d85bd64ba6b67e6a80))


### ✅ Tests

* add comprehensive tests for persist-storage, store timer, and json-utils ([ad2bb79](https://github.com/habolanos/devsecops-process-tracker/commit/ad2bb79c8c2fa903c951a9acb7798d97bd6e4e63))
* increase coverage to 86.86% - add store and helpers additional tests ([36f77a0](https://github.com/habolanos/devsecops-process-tracker/commit/36f77a00b0f7fb3962dd7f66b71e1fee8e1b51ae))


### 👷 CI/CD

* add GitHub Actions workflows with security standards ([c4b6b87](https://github.com/habolanos/devsecops-process-tracker/commit/c4b6b87789b3ef4a80bddc5009c8b364fd938e78))
* finalize ESLint migration and merge stash changes ([60276fb](https://github.com/habolanos/devsecops-process-tracker/commit/60276fb94dafb167fe613a22f02fe902cf19b868))
