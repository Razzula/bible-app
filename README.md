# bible-app

## Demo

You can run a lightweight static demo of the application [here](https://razzula.github.io/bible-app/).

## Installation
### Prerequisites

1. [Node.js & npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

2. [bun](https://bun.sh/)

    Linux: `curl -fsSL https://bun.sh/install | bash`

    Windows: `powershell -c "irm bun.sh/install.ps1 | iex"`

### Dependencies
1.  `bun install `
3.  `bun run setup`
4. Requires Bible contents as specially-formatted JSON files in `Documents\bible-app\Scripture\...\`, with the naming convention `BOOK.CHAPTER` (where `BOOK` is the USFM shorthand, such as `GEN` for Genesis).

`GEN.1`, `GEN.2`, `DEU.28` and `MAT.5` are provided as examples in [`./example/Scripture/...`](/example/Scripture/). The helper script, `setup.bat` will copy any included examples into the correct directory for use.
(If your Documents folder is not located at `...\Users\USERNAME\Documents`, you will need to edit the script to point to the correct location, or manually copy the files.)

See [`./script`](/script) for information on how to generate these files.

### Running

`bun run electron:serve`

The file `launcher.bat` can be used to pull and run the latest deployment version (latest commit in `master`).

To run just the web version, use `bun run dev`, or `bun run serve` (to run a built version).

### Building

`bun run build`

## License
### GNU GPLv3

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

See [LICENSE.md](https://github.com/Razzula/ible-app/blob/main/LICENSE.md) for details.

There are, however, some exceptions to this:

### New King James Version®. Copyright © 1982 by Thomas Nelson

_Whilst this application requires data from the Bible in order to function, this repo does not provide these files other than a small number of [demo](https://github.com/Razzula/bible-app/tree/main/example/Scripture/) files. Some of these files are of the New King James Version, and are included under the [Gratis Use Guidelines](https://www.thomasnelson.com/about-us/permissions/#permissionBiblequote)._

Scripture taken from the New King James Version®. Copyright © 1982 by Thomas Nelson. Used by permission. All rights reserved.

### The Holy Bible, English Standard Version® (ESV®) © 2001 by Crossway, a publishing ministry of Good News Publishers.

_Whilst this application requires data from the Bible in order to function, this repo does not provide these files other than a small number of [demo](https://github.com/Razzula/bible-app/tree/main/example/Scripture) files. Some of these files are of the English Standard Version, and are included under [Crossway's Standard Use Guidelines for the ESV](https://www.crossway.org/permissions/)._

Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved. The ESV text may not be quoted in any publication made available to the public by a Creative Commons license. The ESV may not be translated in whole or in part into any other language
