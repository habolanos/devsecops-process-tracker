# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.25.0](https://github.com/habolanos/devsecops-process-tracker/compare/1.24.0...1.25.0) (2026-04-08)


### 🚀 Features

* add dedicated Excel generation button for export-excel task type ([a991eb4](https://github.com/habolanos/devsecops-process-tracker/commit/a991eb428731202ad7dd8f3b64d0b95e76d61eb6))
* add detail-list task type with Excel mapping ([6d728a5](https://github.com/habolanos/devsecops-process-tracker/commit/6d728a597341e21fa28ce382f2fb210309b9bbdb))
* add dynamic-list task type and optimize checkbox performance ([7bc770e](https://github.com/habolanos/devsecops-process-tracker/commit/7bc770e2a4bea0b59ba230e7ffc7eb8517991250))
* add excel generator for release checklist report ([e91beec](https://github.com/habolanos/devsecops-process-tracker/commit/e91beecc9434ed5ef60c88d4292471121685da30))
* add export-excel task type for automatic release checklist generation ([b2dd5af](https://github.com/habolanos/devsecops-process-tracker/commit/b2dd5afadb00d549c596f4729739f2e9fb918aed))
* add release-checklist process to index ([1c9527f](https://github.com/habolanos/devsecops-process-tracker/commit/1c9527f24ab8e22f0067f72fec5dd50967054393))
* auto-complete task after successful Excel generation ([6772fcf](https://github.com/habolanos/devsecops-process-tracker/commit/6772fcff3751ea956d53db15ba53d4bd3134af8f))
* open evidence modal when task requires evidence on completion ([61e3086](https://github.com/habolanos/devsecops-process-tracker/commit/61e30869df632863d4c42e6424c5e59d5b99cf44))


### 🐛 Bug Fixes

* add evidence support for new task types in Word report ([1210820](https://github.com/habolanos/devsecops-process-tracker/commit/12108207c148b8158b2103bb64f86096c5312f8b))
* add export-excel task type to YAML parser ([da884a8](https://github.com/habolanos/devsecops-process-tracker/commit/da884a8bece2a36e35b249e515c9925b0cb62f79))
* add form task type with grid layout and Excel mapping ([8d27565](https://github.com/habolanos/devsecops-process-tracker/commit/8d275654d3c52a38c6ff8bb4acf9de227c163a2e))
* complete JSON export with all task data for new types ([82000f3](https://github.com/habolanos/devsecops-process-tracker/commit/82000f3c5828ac9afb4083288999b46794dec9c5))
* improve timer status message visibility - larger text and better colors ([330da49](https://github.com/habolanos/devsecops-process-tracker/commit/330da49971dee1ea7d95f9e0bbc62dcda930c40c))
* improve timer tooltip to always show estimated time and status ([a8a48dd](https://github.com/habolanos/devsecops-process-tracker/commit/a8a48ddf956fe46f94f85bb9c6adf714ed1025d0))
* pause timer on component unmount when leaving process page ([f575488](https://github.com/habolanos/devsecops-process-tracker/commit/f575488f97d52e7fd2a1db91ea3a475b3104372b))
* reduce timer status text to 10px and improve tooltip with full status ([41c1f68](https://github.com/habolanos/devsecops-process-tracker/commit/41c1f68c2332643f0f2511dea7889f50921e38e9))
* replace cell tokens in form labels for Word report ([e52d7d7](https://github.com/habolanos/devsecops-process-tracker/commit/e52d7d722bafad86fc523ac2a57187eadc6aaf85)), closes [#OFFSET-1](https://github.com/habolanos/devsecops-process-tracker/issues/OFFSET-1)
* **tests:** stabilize coverage failures in task-card and storage ([169cc5e](https://github.com/habolanos/devsecops-process-tracker/commit/169cc5ed50b10f950c271d37eb074437ff42e62d))
* **yaml-parser:** add detail-list to valid task types validation ([6e3f687](https://github.com/habolanos/devsecops-process-tracker/commit/6e3f6871a976049c808d9a9dbcf872e690c2e90e))


### 🔃 Refactoring

* rename README-DOCKER.md to README.dockerhub.md ([66d5e8f](https://github.com/habolanos/devsecops-process-tracker/commit/66d5e8f6f5dad6c7dae554f81952ab1a9819fcea))


### 📖 Documentation

* add links to additional README files in main README ([fa22c26](https://github.com/habolanos/devsecops-process-tracker/commit/fa22c26e5f60c88ddda200ff6b3c2ad01a8208fe))
* move change history to README.history.md ([f0476e9](https://github.com/habolanos/devsecops-process-tracker/commit/f0476e9ae11704de85522c92624ec9581f4e7ab4))
* **readme:** add v1.29.1 changelog for cell reference tokens ([86b0ed7](https://github.com/habolanos/devsecops-process-tracker/commit/86b0ed70ba62f103f69b0d1df7455c1e07508a3a))
* **readme:** add v1.29.2 changelog for Word evidence fix ([fe47316](https://github.com/habolanos/devsecops-process-tracker/commit/fe47316824286d664f677f33cdeb4eb680fd44ba))
* **readme:** add v1.29.3 changelog for Word token replacement fix ([386b523](https://github.com/habolanos/devsecops-process-tracker/commit/386b523a1e0b8bc0ca13d44bd35784ab8390c236))
* **readme:** add v1.29.4 changelog for JSON export fix ([d268713](https://github.com/habolanos/devsecops-process-tracker/commit/d268713dba8e5d68f885d61f935641bc351f333e))
* **readme:** add v1.29.5 changelog for testing coverage ([98f8309](https://github.com/habolanos/devsecops-process-tracker/commit/98f830940d145873d105a7773a3edcae2c772849))
* **readme:** fix markdown rendering issue ([1b71622](https://github.com/habolanos/devsecops-process-tracker/commit/1b716229d9f058fe423e2e840b1f8e2272b3fb92))
* **readme:** update changelog to remove YAML version update reference ([e69fdfb](https://github.com/habolanos/devsecops-process-tracker/commit/e69fdfb1928fca288dc89984d232c938e7896f5c))
* **readme:** update README with v1.28.0 changes ([9761fa5](https://github.com/habolanos/devsecops-process-tracker/commit/9761fa5732ff1e8818f3a9392e5a7248ac7f49d9))
* **readme:** update v1.29.5 changelog to include YAML version updates ([eef8bc9](https://github.com/habolanos/devsecops-process-tracker/commit/eef8bc9172a5ce67ef2181548cf3faf2a2bb56bd))
* update README with v1.27.0 changes and improve structure ([f1d152b](https://github.com/habolanos/devsecops-process-tracker/commit/f1d152b7b55a76127628d530f8db171d26bc25ba))


### 🧪 Tests

* add tests for export-excel task type and release checklist process ([20d3ece](https://github.com/habolanos/devsecops-process-tracker/commit/20d3ece618dc07c043adb20779b9b6a2a5c33b9b))
* add unit tests for excel-template-helper and json-utils ([0daa08d](https://github.com/habolanos/devsecops-process-tracker/commit/0daa08d87291f581c787dbdf8e096f618bad7693))
* **coverage:** add targeted tests for low-coverage modules ([f7a9824](https://github.com/habolanos/devsecops-process-tracker/commit/f7a9824e1139fbdf072deaaf4da061678cc553ff))
* fix excel-generator tests to match implementation ([91ec7b0](https://github.com/habolanos/devsecops-process-tracker/commit/91ec7b0dfe1c8ea16a29e1cb4de1f414b71956a9))
* increase excel-generator.ts coverage from 16% to 95% ([dab7783](https://github.com/habolanos/devsecops-process-tracker/commit/dab7783ee87017b0cbb446f49bc58ec109f41b03))
* increase test coverage for task-card.tsx and store.ts ([807059b](https://github.com/habolanos/devsecops-process-tracker/commit/807059bae7528d71c3db3452925777849608c38e))


### 🔀 CI/CD

* relax commitlint rules to be less restrictive ([3d057b0](https://github.com/habolanos/devsecops-process-tracker/commit/3d057b0db2c92630195a649ed6c57bc03f44a868))
* relax commitlint rules to be less restrictive ([e7c9f05](https://github.com/habolanos/devsecops-process-tracker/commit/e7c9f052749ac7a8c481c23d7c4a2be1d596dc11))

## [1.24.0](https://github.com/habolanos/devsecops-process-tracker/compare/1.23.0...1.24.0) (2026-04-06)


### 🚀 Features

* add estimated time with semaphore colors to process timer ([b7d6074](https://github.com/habolanos/devsecops-process-tracker/commit/b7d6074ddb9c29fdb3a0f81dd1218bab3a5664aa))
* add github-style global progress indicator for loading operations ([bffe72a](https://github.com/habolanos/devsecops-process-tracker/commit/bffe72a1118af6c4078bf2612d79375559c601f3))
* auto-start process timer on first user interaction ([9b8f243](https://github.com/habolanos/devsecops-process-tracker/commit/9b8f243085c424bf5447b27a3bccf9e70d0f9268))


### 🐛 Bug Fixes

* add clearstorage helper and temporary button to fix progress calculation issue ([b1bb992](https://github.com/habolanos/devsecops-process-tracker/commit/b1bb992bb86c5c8e6b2a3dcae658758dab4a84b2))
* add load: true to docker build for trivy image scan ([53ce2be](https://github.com/habolanos/devsecops-process-tracker/commit/53ce2be48ffcba214df8ceea00024ffe1b92cee1))
* add missing translation for process.completed ([3da9474](https://github.com/habolanos/devsecops-process-tracker/commit/3da9474895be95f465d0102e49476bc19ea0ce86))
* auto-resume timer when user interacts with paused process ([de38830](https://github.com/habolanos/devsecops-process-tracker/commit/de38830e50a71346c819c24b5978703be1279b13))
* change nested button to div in processtabs to fix html validation error ([7a6c575](https://github.com/habolanos/devsecops-process-tracker/commit/7a6c575e7e378e5f574ef3ebf1dee43a48964c6a))
* correct progress display - multiply decimal by 100 to show percentage ([1a4e31b](https://github.com/habolanos/devsecops-process-tracker/commit/1a4e31b8830ecca86554c612b6d0a24796e7a17b))
* disable view button on blocked tasks and complete button when process is finished ([445fa9b](https://github.com/habolanos/devsecops-process-tracker/commit/445fa9b81704c2fc2fd9fd4423597dc885192950))
* downgrade npm to v9.9.0 to avoid picomatch/brace-expansion vulnerabilities in global npm ([877c038](https://github.com/habolanos/devsecops-process-tracker/commit/877c038d99d7f7be015dd7e452e44aa03d4daaaf))
* make progress bar thinner (h-0.5) and add debug logs for timer and progress indicator ([7b25a05](https://github.com/habolanos/devsecops-process-tracker/commit/7b25a05ad20b8167d013bfed11559610108063b4))
* move process name above progress bar, restore timer buttons with text ([5ca3bb7](https://github.com/habolanos/devsecops-process-tracker/commit/5ca3bb7eb01c76cd17efded05a3a97ac30e57f29))
* parse json string before passing to importprocessfromjson ([626b2b4](https://github.com/habolanos/devsecops-process-tracker/commit/626b2b4328ae8327c91fc588f9c9cbda61b31f61))
* pause button, process name spacing, and variables.button translation ([868356c](https://github.com/habolanos/devsecops-process-tracker/commit/868356c364f62619a1f6045685d1170853bf492c))
* remove -mb-px from active tab that might hide tabs visually ([c6bd6d4](https://github.com/habolanos/devsecops-process-tracker/commit/c6bd6d45e861fb83839504412b4bfdad3d88c8e1))
* remove progress * 100 multiplication since process.progress is already in percentage ([ac19eec](https://github.com/habolanos/devsecops-process-tracker/commit/ac19eeca1f43bb1a1aa8e47cc3a5f54e60dcb7fb))
* remove unused imports and fix typescript errors in tests ([4890204](https://github.com/habolanos/devsecops-process-tracker/commit/4890204c0f840b7cba0a7c5b95c4df891b8aee1c))
* timer auto-start, back button pause, progress bar animation, and performance optimization ([3f892f7](https://github.com/habolanos/devsecops-process-tracker/commit/3f892f7c7781827f2b2016bc53525e1d9b9e2f31))
* update globalprogressindicator component and tests to pass ([b4b04d3](https://github.com/habolanos/devsecops-process-tracker/commit/b4b04d39397877e0c4246e636155d386b7090e49))


### 🔃 Refactoring

* compact header layout, simplify export buttons, improve timer design ([0156287](https://github.com/habolanos/devsecops-process-tracker/commit/015628773d38d438ee3db7d6c1c78eb285da1316))
* process page layout - fixed header, inline tabs, single-line progress bar ([ae11b5e](https://github.com/habolanos/devsecops-process-tracker/commit/ae11b5e72c9879badda8c90b78376048679a1fff))
* remove temporary clearstorage button from homepage ([d8afd87](https://github.com/habolanos/devsecops-process-tracker/commit/d8afd87932f64ba0eb448a7dedef112d72efb8e7))


### 📖 Documentation

* add v1.21.0 security fix to changelog (0 vulnerabilities in Trivy scan) ([6878070](https://github.com/habolanos/devsecops-process-tracker/commit/68780702cc12684dbf66b1fac2dd46240b0cc25d))
* add version 1.23.0 to changelog with fixes and performance improvements ([a0ea9f7](https://github.com/habolanos/devsecops-process-tracker/commit/a0ea9f7fa720b06623636fe9fd6c77f8c2d5178f))
* add version 1.24.0 to changelog with estimated time and semaphore colors ([452573f](https://github.com/habolanos/devsecops-process-tracker/commit/452573f8e771da916acfbadb2339945761919e91))
* update changelog with .trivyignore explanation ([b4d5072](https://github.com/habolanos/devsecops-process-tracker/commit/b4d5072d7478e79d237104d16ad805dd435450fc))
* update changelog with global progress indicator and auto-start timer (v1.22.0) ([bf9614d](https://github.com/habolanos/devsecops-process-tracker/commit/bf9614df1e4a4530902043b8af62ac2c64f5ee0a))


### 🧪 Tests

* add and update tests for auto-start timer on first interaction ([4491001](https://github.com/habolanos/devsecops-process-tracker/commit/4491001ea15cbd7fd253ed206209438222954881))

## [1.23.0](https://github.com/habolanos/devsecops-process-tracker/compare/1.22.1...1.23.0) (2026-04-06)


### 🚀 Features

* update base image to node:24-alpine3.21 for latest stable Alpine ([2e9f294](https://github.com/habolanos/devsecops-process-tracker/commit/2e9f294f3a4223dc6a0df085c42d21742c64e9c4))

## [1.22.1](https://github.com/habolanos/devsecops-process-tracker/compare/1.22.0...1.22.1) (2026-04-06)


### 🐛 Bug Fixes

* add minimatch and brace-expansion overrides with secure older versions compatible with ESLint ([43fa9b9](https://github.com/habolanos/devsecops-process-tracker/commit/43fa9b9127c288db31b3350b23cc23684eaaaa9f))
* remove minimatch and brace-expansion overrides (ESLint compatibility issue) ([dec0c0a](https://github.com/habolanos/devsecops-process-tracker/commit/dec0c0ac7caf64349cd77b2c281ab89f5e254085))
* update npm and add overrides for vulnerable packages (minimatch, brace-expansion, picomatch, tar) ([f9f3956](https://github.com/habolanos/devsecops-process-tracker/commit/f9f3956cd274da89eb97bbca0ba620ef173ef383))

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

* add README.dockerhub.md for Docker Hub with author info and improved categories API ([d4b80a7](https://github.com/habolanos/devsecops-process-tracker/commit/d4b80a71c6a75471ac2235d8e5049d25bfe3be5c))


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
