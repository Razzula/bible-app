# bible-app/server

This is the server component of the Bible App. It is a simple Express server that serves the Bible data to the client.

## Installation
### Prerequisites

1. [Node.js & npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

2. [bun](https://bun.sh/)

    Linux: `curl -fsSL https://bun.sh/install | bash`

    Windows: `powershell -c "irm bun.sh/install.ps1 | iex"`

### Dependencies
1.  `bun install `
2.  The server will host any files in the `/public` directory. However, you can use `NODE_ENV=dev` to serve the example files in the root of this repo.

### Running

`bun run dev`

You can use `NODE_ENV=dev` to run the server in development mode.

### Building

`bun run build`

## License
### GNU GPLv3

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

See [LICENSE.md](https://github.com/Razzula/ible-app/blob/main/LICENSE.md) for details.
