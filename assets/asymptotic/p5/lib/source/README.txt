Source code for the p5.js files in assets/asymptotic/p5/lib/

p5.js is licensed under the GNU Lesser General Public License, version 2.1;
see ../licenses/p5-LGPL-2.1.txt. This directory holds the source code of
each p5.js version this site serves, next to the files themselves, and the
packages, as published on npm, whose code p5.js's build compiles into them
(five upstream build sources are not here; see below).


p5.js

Each archive holds the p5.js repository, github.com/processing/p5.js, at
that version's release commit: the library source in src/, the scripts and
configuration p5.js uses to build p5.min.js from it (Gruntfile.js, tasks/,
package.json and package-lock.json), and its license.txt. Every file in an
archive is byte-identical to the file at the same path in that commit. File
owners, modes and timestamps are normalized.

  p5.js-1.1.9-source.tar.gz
      commit d35bef5faa75fe33741632e2127d1d19396327e8
      SHA-256 3c484077075088602f45f102a56e55e1efc6f8424b9a0b238ee9e83bcb256d7d
  p5.js-1.4.0-source.tar.gz
      commit cb3f59740bcb71ba5e2bee820bb1f784004d85ef (tag v1.4.0)
      SHA-256 7892d50d92442f6583926ea8b85cc3fd09184ac64ecce12a5827fec019af952b
  p5.js-1.11.7-source.tar.gz
      commit 5f0fcfac9d03a5ec2fee271a98fa1d1edb70ec68 (tag v1.11.7)
      SHA-256 468976244d6c4d87126a6081b7cec0a07d7450bd633e854723bf8792b44630ae
  p5.js-1.11.11-source.tar.gz
      commit 28b17b5d887e68808e0e057b3e7eb5b1cddd86b3 (tag v1.11.11)
      SHA-256 f495b017f1df5f256d014d6043b50188d28a1f30968fddf99c5390619a83a72a

For 1.1.9, the repository's tag 1.1.9 points to the 1.1.7 release commit,
b15ca7c7ac8ba95ccb0123cf74fc163040090e1b, whose package.json gives version
1.1.7. The 1.1.9 release on npm records d35bef5 as its commit, and its
package.json gives 1.1.9. The two commits differ only in package.json and
package-lock.json.

Each archive leaves out test/, docs/, contributor_docs/, lib/, .github/,
.vscode/ and tweets/: tests, documentation and its site theme, contributor
guides, prebuilt files, and CI and editor settings. One version is the
exception: the 1.1.9 p5.min.js compiles in docs/parameterData.json, so its
archive keeps that file, the scripts that generate it from the source
comments (docs/preprocessor.js and docs/documented-method.js), and
lib/addons/p5.sound.js, whose comments the generation also reads.


Rebuilding p5.min.js

In the unpacked directory of an archive, run:

    npm ci --ignore-scripts
    ./node_modules/.bin/grunt browserify:min uglify

npm ci fetches p5.js's build tools (Browserify, Babel, uglify-js and the
rest of package-lock.json) from the npm registry, at the versions and
integrity hashes package-lock.json pins. They are not in this directory,
apart from the four in bundled/ that write code into the output.
--ignore-scripts keeps npm from running install scripts, which this build
does not need; 1.1.9's package.json also names p5.js's full build, which
renders the reference documentation from docs/, as a prepublish script.
The two grunt tasks write lib/p5.min.js, and they write the build date into
its first line.

On 2026-11-11, with Node.js 22.12.0 and npm 10.9.0, these steps were run on
each of the four archives. Each produced a lib/p5.min.js identical byte for
byte to the file this site serves, apart from the build date in the first
line. The same steps on the repository's whole tree at the same commit, as
GitHub archives it, produced the same file.


Packages compiled into p5.js

bundled/ holds, as published on npm, the packages whose code p5.js's build
compiles into the p5.js files: the packages p5.js's source imports, with
the packages inside opentype.js; the browser versions of Node.js modules
that Browserify supplies; the polyfills Babel adds (core-js and
regenerator-runtime); and four packages of the build tools that write code
into the output, browser-pack and umd (the bundle's module loader and outer
wrapper), insert-module-globals (the wrappers around modules that use
Node.js's globals) and @babel/helpers (the helper functions Babel writes
into p5.js's own code). Each tarball is byte-identical to the npm
registry's copy and matches the integrity hash recorded for it in the
package-lock.json of each version that contains it.
../licenses/p5-bundled-packages.txt lists which versions contain each
package, gives its license text where the package publishes one, and says
where a package publishes none.

  babel-helpers-7.7.4.tgz (@babel/helpers)
      SHA-256 daff9a0669de3199b3dd5ecc81cd4db87883c361d163e02144e0e30fbf2dcbe4
  base64-js-1.3.1.tgz
      SHA-256 e07a87b3d76297252f6284c37fc2c16929a80c17886740ba2093251b82e40368
  browser-pack-6.1.0.tgz
      SHA-256 13db68f814f0b0b943de116b36eee620f23eb857fba80c342791288cf0320dd1
  buffer-5.4.3.tgz
      SHA-256 de50d5a49a3bcef700033757dd972bcb0e9b5ff76b7326bdfd66126658ea12ca
  core-js-3.6.5.tgz
      SHA-256 082bee4044f3cdc241972efc2fcb1fca66d223570c259f10d34553deda83e622
  es6-promise-4.2.8.tgz
      SHA-256 ea3adc416f8327d7b505df5585b4418d454cc295d25d9cd402bd0c10d89866a7
  fetch-jsonp-1.1.3.tgz
      SHA-256 eee9c55918344b26a3dcff2a9047e2f1d030508bd84dc52d9d1439770b3ccf9f
  file-saver-1.3.8.tgz
      SHA-256 4ea3d5b8888cc1a4b466ab8ab67b732540945d02093dbfceeac89a688412612c
  gifenc-1.0.3.tgz
      SHA-256 29470c10132cd66ecac3b4da025b57ab9ec35df6e40215947f22eb2f14a128d4
  ieee754-1.1.13.tgz
      SHA-256 603e6b4c40da1551bbaabe8aa8a4b35f62f132b0b60e99906a59f0ad04d47ae2
  insert-module-globals-7.2.0.tgz
      SHA-256 89b69a7608abbe55bd221bbb83205a832cc19feac7886855c1a720932a16484d
  libtess-1.2.2.tgz
      SHA-256 76cdbd2b1d5fc91b62747dca1239b412fcce0c326cf50d29f743122ce0e4276a
  omggif-1.0.10.tgz
      SHA-256 576d726ddedd2c546750707e01cd247752027aa9250a6066e32047aa3d25287e
  opentype.js-0.9.0.tgz
      SHA-256 c7003f4c5c2c62b8ddf44b1e80a405fdcdb264bc0ff1f1aaea06ce864cb6b4aa
  path-browserify-0.0.1.tgz
      SHA-256 b3e1d5374bbffb6414cbf83e4519e694d937d10534b3a80ccef5c02205e3011a
  process-0.11.10.tgz
      SHA-256 7c10569b3c9cb056152ad630d40f9f4fcc321a0013c2bb8384f036aaa674e6bb
  regenerator-runtime-0.13.3.tgz
      SHA-256 1814cad2f542218c6e8977bbe19ea0fbf869e79da5754c0c245e7587a9c8d26e
  string.prototype.codepointat-0.2.1.tgz
      SHA-256 56b503621758bcd07cab136b20c1c075816be681dd63d0570f68c346c126c13c
  tiny-inflate-1.0.2.tgz
      SHA-256 9d9a0912315462c9c380544ae325a2cb4d37471c0099be8444e99589213539d8
  umd-3.0.3.tgz
      SHA-256 d4af77eb6e785d8a8a5b1ffc67490807d13b432aad1a222466d8270384b8ef91
  whatwg-fetch-2.0.4.tgz
      SHA-256 4258863744692afc3715cb0250f48a7b15d41424ccc6f8261e21ba1ebe3bb57f

The file p5.js's build reads from a package is usually that package's own
source. Where it is the output of the package's own build, the package
holds the source as well, except in these five cases. The upstream form is
in the package's repository at the commit npm records for the release, and
it is not in this directory:

  fetch-jsonp 1.1.3: src/fetch-jsonp.js, which its build compiles into
      build/fetch-jsonp.js. github.com/camsong/fetch-jsonp, commit
      0dfd008b28fe230f3543a075aeabb7b4da408a95
  libtess 1.2.2: src/ and gulpfile.js, from which its build makes
      libtess.min.js. The package also holds two unminified files,
      libtess.cat.js and libtess.debug.js.
      github.com/brendankenny/libtess.js, commit
      f88246ee473984be763dc09de492755e6c55b71f
  umd 3.0.3: template.js and source.js, from which its build makes
      index.js. github.com/ForbesLindesay/umd, commit
      9aa85b63ef4e6809dc9f0f9993a574919ef20e7a
  es6-promise 4.2.8: Brocfile.js and config/versionTemplate.txt, the build
      configuration that makes dist/es6-promise.js from lib/, which the
      package holds. github.com/stefanpenner/es6-promise, commit
      1e68dce6f674e5613f4a1797aedd55dc70ac1dcb
  @babel/helpers 7.7.4: packages/babel-helpers/src/helpers.js, which
      Babel's build compiles into lib/helpers.js. The code of the helpers
      p5.js uses is the same text in both. github.com/babel/babel, commit
      75767d87cb147709b9bd9b99bf44daa6688874a9

opentype.js's package holds its src/, rollup.config.js and
package-lock.json; built from them on 2026-11-11, its dist/opentype.js,
the file p5.js compiles in, came out byte-identical to the published one.
