# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.22.0](https://github.com/habolanos/devsecops-process-tracker/compare/1.21.4...1.22.0) (2026-04-06)


### 🚀 Features

* externalize Docker image labels to .docker.labels file ([c2d199d](https://github.com/habolanos/devsecops-process-tracker/commit/c2d199d89034f17c625568ea1ca3f3c03541fd1e))
* use BASE_IMAGE ARG for dynamic base.name label ([a9782ff](https://github.com/habolanos/devsecops-process-tracker/commit/a9782ff29906cef8ab0422bac6403088f7ecafbd))
* use BASE_IMAGE ARG globally across all Dockerfile stages ([56d023e](https://github.com/habolanos/devsecops-process-tracker/commit/56d023e655bd7aded822e1f8c2e2ad2d0e2e44fd))


### 🐛 Bug Fixes

* add npm audit fix --force to resolve remaining vulnerabilities ([81d6a60](https://github.com/habolanos/devsecops-process-tracker/commit/81d6a60bbb3ea8f2926cdbeca6486432658344be))
* add npm overrides to force secure versions of minimatch, picomatch, tar, brace-expansion ([68fea2c](https://github.com/habolanos/devsecops-process-tracker/commit/68fea2c2a08762a39f4b30f869b5fafe5d9c7113))
* add secure versions of minimatch, picomatch, tar, brace-expansion as direct dependencies ([1423d51](https://github.com/habolanos/devsecops-process-tracker/commit/1423d51babb0ba849c9e7422f698c5278e5a82ed))
* explicitly install secure versions of vulnerable packages ([d99f54f](https://github.com/habolanos/devsecops-process-tracker/commit/d99f54f440123be8402d9a076a5054a569781db2))
* remove package-lock.json copy to allow overrides to work correctly ([70e864e](https://github.com/habolanos/devsecops-process-tracker/commit/70e864edbd61a448ab32038b2da3fb44b13f14a9))
* update @eslint/eslintrc and adjust overrides for compatibility ([9db1fc9](https://github.com/habolanos/devsecops-process-tracker/commit/9db1fc9553c4092a6572dba1a242f4251b421cfb))
* update OCI labels with correct vendor and license information ([d54cbc2](https://github.com/habolanos/devsecops-process-tracker/commit/d54cbc249c4e38235d860ab19771e3c5013eaa3e))
* update package-lock.json with lodash security fixes ([e929d1a](https://github.com/habolanos/devsecops-process-tracker/commit/e929d1ad91a287302fc95cc3600fd99e5330e5c8))
* use npm ci with package-lock.json for reproducible builds with security fixes ([3d673e8](https://github.com/habolanos/devsecops-process-tracker/commit/3d673e88d0f054d98648b28176675369dc451d6b))
* use npm install instead of npm ci to apply overrides ([2a4743e](https://github.com/habolanos/devsecops-process-tracker/commit/2a4743edcb013b9b5254b081e7503a6e27071c67))
* use npm overrides to force secure versions of vulnerable transitive dependencies ([862c729](https://github.com/habolanos/devsecops-process-tracker/commit/862c72935fb71a743aca142e4c51783d46161c54))

## [1.21.4](https://github.com/habolanos/devsecops-process-tracker/compare/1.21.3...1.21.4) (2026-04-05)


### 🐛 Bug Fixes

* update Alpine packages and apply npm audit fix to resolve security vulnerabilities ([16cc052](https://github.com/habolanos/devsecops-process-tracker/commit/16cc0520223298cea42fb1ee8a2bb04bde3b18c6))


### 🔀 CI/CD

* ensure Trivy table report always runs to show vulnerabilities before job fails ([dfcaaf5](https://github.com/habolanos/devsecops-process-tracker/commit/dfcaaf59c3b11679ce6f66a0dadbdee159b4f259))
* fix README ([c593b51](https://github.com/habolanos/devsecops-process-tracker/commit/c593b517372d2fe0d95cebc00049ae06bc263bac))
* fix README escaping with --rawfile and simplify categories to manual instructions ([ab302b5](https://github.com/habolanos/devsecops-process-tracker/commit/ab302b5a2a0b7beaf91259466d48ac451d66f3cf))
* include MEDIUM severity in blocking security scan ([9954783](https://github.com/habolanos/devsecops-process-tracker/commit/9954783ae90d3cbd8ac1adc80c8f090d091e9902))
* make security scan BLOCKING - fail pipeline on HIGH/CRITICAL vulnerabilities ([91b9d07](https://github.com/habolanos/devsecops-process-tracker/commit/91b9d07e0d3dfc407a65fd3381ed2c2eb8517868))
* restructure workflow to scan BEFORE push - security-first pipeline ([a2906e5](https://github.com/habolanos/devsecops-process-tracker/commit/a2906e5b755f25a99fb895100f9241c2e9b28222))
* update Docker image labels - vendor to Harold Adrian, license to GPL-3.0 ([9c16894](https://github.com/habolanos/devsecops-process-tracker/commit/9c168943aa2fff2393cf8272fe11cca836f2d805))

## [1.21.3](https://github.com/habolanos/devsecops-process-tracker/compare/1.21.2...1.21.3) (2026-04-05)


### 🐛 Bug Fixes

* add README-DOCKER.md for Docker Hub with author info and improved categories API ([d4b80a7](https://github.com/habolanos/devsecops-process-tracker/commit/d4b80a71c6a75471ac2235d8e5049d25bfe3be5c))


### 📖 Documentation

* update docker-compose section to reference existing docker-compose.yml file ([6396e74](https://github.com/habolanos/devsecops-process-tracker/commit/6396e745e39e7392778d6e2dc18db888915a8f37))


### 🔀 CI/CD

* add Docker Hub category listing and improved category API handling ([372da6c](https://github.com/habolanos/devsecops-process-tracker/commit/372da6c8a472034e6d2e2a162576694078f8ae68))

## [1.21.2](https://github.com/habolanos/devsecops-process-tracker/compare/1.21.1...1.21.2) (2026-04-05)


### 🐛 Bug Fixes

* separate Docker Hub description and categories API calls, increase overview size ([2c0ead8](https://github.com/habolanos/devsecops-process-tracker/commit/2c0ead82d816f422b106d26be17dedc845a75983))

## [1.21.1](https://github.com/habolanos/devsecops-process-tracker/compare/1.21.0...1.21.1) (2026-04-05)


### 🐛 Bug Fixes

* Docker Hub metadata API payload size and JSON escaping ([1e64594](https://github.com/habolanos/devsecops-process-tracker/commit/1e64594afdfa21331ac633a439b8c4ad301db920))


### 📖 Documentation

* enrich Docker section with detailed execution guides and update history ([e6a5d86](https://github.com/habolanos/devsecops-process-tracker/commit/e6a5d867ea278115102e6157dabd0197690db1e5))
* fix duplicate Docker section and change license from MIT to GNU GPL-3.0 ([a1ca656](https://github.com/habolanos/devsecops-process-tracker/commit/a1ca656ecb2f60b3f46d512a39328420b17b61be))

## [1.21.0](https://github.com/habolanos/devsecops-process-tracker/compare/1.20.0...1.21.0) (2026-04-05)


### 🚀 Features

* add Docker Hub repository metadata update job ([ac804e2](https://github.com/habolanos/devsecops-process-tracker/commit/ac804e22fe8e7487c56a6025571589fd9367dc0f))

## [1.20.0](https://github.com/habolanos/devsecops-process-tracker/compare/1.19.0...1.20.0) (2026-04-05)


### 🚀 Features

* prioritize semver tags and fix GHCR API for user-owned packages ([ea71e73](https://github.com/habolanos/devsecops-process-tracker/commit/ea71e734d6f2e6f5721a216c5b71f03c291d3dd1))

## [1.19.0](https://github.com/habolanos/devsecops-process-tracker/compare/1.18.0...1.19.0) (2026-04-05)


### 🚀 Features

* Ahora solo generará el tag completo de la versión. Tags simplificados ([0829cee](https://github.com/habolanos/devsecops-process-tracker/commit/0829ceee0a184ab0506b284c821892e80fcb162d))

## [1.18.0](https://github.com/habolanos/devsecops-process-tracker/compare/1.17.0...1.18.0) (2026-04-05)


### 🚀 Features

* Annotations ([24551ed](https://github.com/habolanos/devsecops-process-tracker/commit/24551ed0a5f8613f0c4476a3e877a48955a2525a)), closes [Dockerfile#L54](https://github.com/habolanos/Dockerfile/issues/L54) [Dockerfile#L54](https://github.com/habolanos/Dockerfile/issues/L54) [Dockerfile#L54](https://github.com/habolanos/Dockerfile/issues/L54) [Dockerfile#L54](https://github.com/habolanos/Dockerfile/issues/L54) [Dockerfile#L54](https://github.com/habolanos/Dockerfile/issues/L54) [Dockerfile#L54](https://github.com/habolanos/Dockerfile/issues/L54)

## [1.17.0](https://github.com/habolanos/devsecops-process-tracker/compare/1.16.0...1.17.0) (2026-04-05)


### 🚀 Features

* Fixed. The github-script action needs actions: write permission to trigger workflows via the API. Added actions: write to the workflow permissions at [@c](https://github.com/c):\Users\harold.bolanos\repos-publics\devsecops-process-tracker\.github\workflows\cd-release.yml:25 ([8d01f0c](https://github.com/habolanos/devsecops-process-tracker/commit/8d01f0c4f46a9e089cd2c4c9eca043ff0ec76c8e))

## [1.16.0](https://github.com/habolanos/devsecops-process-tracker/compare/1.15.0...1.16.0) (2026-04-05)


### 🚀 Features

* The issue was that github.event.head_commit only exists for push events, but your workflow triggers on release and workflow_dispatch events. ([4a4fe47](https://github.com/habolanos/devsecops-process-tracker/commit/4a4fe47f9f45c1be053a08e62e241d9b7b050051))

## [1.15.0](https://github.com/habolanos/devsecops-process-tracker/compare/1.14.0...1.15.0) (2026-04-05)


### 🚀 Features

* add Bitbucket Pipelines configuration ([7db4493](https://github.com/habolanos/devsecops-process-tracker/commit/7db449351d6669826cede7bc327cbee7aa2257db))
* set node 24 on cd-release ([7b4dc1e](https://github.com/habolanos/devsecops-process-tracker/commit/7b4dc1e44db4417b7fb0de39f59d98a112337f7e))


### 🐛 Bug Fixes

* **release:** capture semantic-release outputs correctly for job dependencies ([17e6283](https://github.com/habolanos/devsecops-process-tracker/commit/17e628380d0909faaae62f54cfd81e44057849a7))

## [1.14.0](https://github.com/habolanos/devsecops-process-tracker/compare/1.13.4...1.14.0) (2026-04-05)


### 🚀 Features

* trigger release to test docker version tags ([efbfcfb](https://github.com/habolanos/devsecops-process-tracker/commit/efbfcfb682ff1533f20b8334f255cc0faaa71800))
* update Azure Pipelines and GitLab CI with latest GitHub workflow definitions ([95ea023](https://github.com/habolanos/devsecops-process-tracker/commit/95ea02386e2289924249144151af0ef7ce5a8c3e))


### 🔀 CI/CD

* **docker:** fix version tags and attestation digest for GHCR ([6cf261e](https://github.com/habolanos/devsecops-process-tracker/commit/6cf261e462b0a35f34859a895442a98f379923d1))
* **docker:** fix version tags and build args for cd-docker-publish ([0656d3c](https://github.com/habolanos/devsecops-process-tracker/commit/0656d3c552b71845ec1d88af58533c41c7a67352))
* **release:** fix broken emoji in job name ([9e88c10](https://github.com/habolanos/devsecops-process-tracker/commit/9e88c106764d3da7c48bf5d7cbd597dce7024198))
* **release:** Rename CI and CD ([4122a19](https://github.com/habolanos/devsecops-process-tracker/commit/4122a194facf4bc7d9f2fb3c063a379da281716b))

## [1.13.4](https://github.com/habolanos/devsecops-process-tracker/compare/1.13.3...1.13.4) (2026-04-03)


### :bug: Bug Fixes

* **release:** replace Unicode emojis with GitHub shortcodes to fix encoding issues ([27892a9](https://github.com/habolanos/devsecops-process-tracker/commit/27892a93c44f965499af0333fe37e9cd411b8147))


### :construction_worker: CI/CD

* **docker:** fix tags to include version and latest on release events ([90b5d9b](https://github.com/habolanos/devsecops-process-tracker/commit/90b5d9b0596243825d9576347a0428cea64451be))

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
