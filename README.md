<p align="center"><img src="https://github.com/stacksjs/httx/blob/main/.github/art/cover.jpg?raw=true" alt="Social Card of this repo"></p>

[![npm version][npm-version-src]][npm-version-href]
[![GitHub Actions][github-actions-src]][github-actions-href]
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
<!-- [![npm downloads][npm-downloads-src]][npm-downloads-href] -->
<!-- [![Codecov][codecov-src]][codecov-href] -->

# httx

> httx is a simple, fast, lightweight and user-friendly API client. Whether you are working with a CLI, a library or a server, httx is a perfect choice for making HTTP requests.

<p align="center"><img src="https://github.com/stacksjs/httx/blob/main/.github/art/screenshot.png?raw=true" alt="Screenshot of httx"></p>

## Features

- 🌐 **API Requests**: _easily make API requests in a familiar way_
- 🤖 **CLI**: _a cross-platform CLI_
- 📚 **Library**: _use httx as a library in your project_
- ⚡ **Performant**: _extremely fast and efficient_
- 🪶 **Lightweight**: _built on web standards, lightweight & without dependencies_
- 🐶 **User-Friendly**: _user-friendly, simple, powerful API_
- 💪🏽 **Type-Safe**: _strongly-typed, including type-safe errors_

## Install

```bash
bun install -d @stacksjs/httx
```

<!-- _Alternatively, you can install:_

```bash
brew install httx # wip
pkgx install httx # wip
``` -->

> [!NOTE]
> We are trying to release under the `httx` package name, which is currently abandoned. Please @npmjs, we would love to!🙏🏽

## Get Started

Making requests is simple. There are two ways of getting started: _as a library or as a CLI._

### Library

Given the npm package is installed:

```ts
import type { HttxConfig } from 'httx'
// import { ... } from 'httx'

// ...
```

In case you are trying to start multiple proxies, you may use this configuration:

### CLI

```bash
httx get api.example.com/users
httx post api.example.com/users name=john email=john@example.com -j
httx get api.example.com/files file@./data.txt -m
httx get api.example.com/secure -a username:password

httx --help
httx --version
```

## Configuration

The Reverse Proxy can be configured using a `httx.config.ts` _(or `httx.config.js`)_ file and it will be automatically loaded when running the `reverse-proxy` command.

```ts
// httx.config.{ts,js}
import type { HttxOptions } from '@stacksjs/httx'
import os from 'node:os'
import path from 'node:path'

const config: HttxOptions = {
  verbose: false,
}

export default config
```

_Then run:_

```bash
./httx
```

To learn more, head over to the [documentation](https://httx.netlify.app/).

## Testing

```bash
bun test
```

## Changelog

Please see our [releases](https://github.com/stacksjs/stacks/releases) page for more information on what has changed recently.

## Contributing

Please review the [Contributing Guide](https://github.com/stacksjs/contributing) for details.

## Community

For help, discussion about best practices, or any other conversation that would benefit from being searchable:

[Discussions on GitHub](https://github.com/stacksjs/stacks/discussions)

For casual chit-chat with others using this package:

[Join the Stacks Discord Server](https://stacksjs.com/discord)

## Postcardware

“Software that is free, but hopes for a postcard.” We love receiving postcards from around the world showing where `httx` is being used! We showcase them on our website too.

Our address: Stacks.js, 12665 Village Ln #2306, Playa Vista, CA 90094, United States 🌎

## Sponsors

We would like to extend our thanks to the following sponsors for funding Stacks development. If you are interested in becoming a sponsor, please reach out to us.

- [JetBrains](https://www.jetbrains.com/)
- [The Solana Foundation](https://solana.com/)

## Credits

- [httpie](https://httpie.io/)
- [Chris Breuer](https://github.com/chrisbbreuer)
- [All Contributors](../../contributors)

## License

The MIT License (MIT). Please see [LICENSE](https://github.com/stacksjs/stacks/tree/main/LICENSE.md) for more information.

Made with 💙

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/@stacksjs/httx?style=flat-square
[npm-version-href]: https://npmjs.com/package/@stacksjs/httx
[github-actions-src]: https://img.shields.io/github/actions/workflow/status/stacksjs/httx/ci.yml?style=flat-square&branch=main
[github-actions-href]: https://github.com/stacksjs/httx/actions?query=workflow%3Aci

<!-- [codecov-src]: https://img.shields.io/codecov/c/gh/stacksjs/httx/main?style=flat-square
[codecov-href]: https://codecov.io/gh/stacksjs/httx -->
