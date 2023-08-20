// This file was converted to TypeScript from the original sindresorhus/electron-serve project JavaScript file.
// The original license is as follows
// MIT License
//
// Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
//
//   The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
//   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import * as electron from 'electron';

const stat = util.promisify(fs.stat);

// See https://cs.chromium.org/chromium/src/net/base/net_error_list.h
const FILE_NOT_FOUND = -6;

const getPath = async (path_: string): Promise<string | undefined> => {
  try {
    const result = await stat(path_);

    if (result.isFile()) {
      return path_;
    }

    if (result.isDirectory()) {
      return getPath(path.join(path_, 'index.html'));
    }
  } catch (_) {}
};

interface Options {
  isCorsEnabled?: boolean;
  scheme?: string;
  directory?: string;
  partition?: string;
}

export default (options: Options) => {
  options = Object.assign({
    isCorsEnabled: true,
    scheme: 'app'
  }, options);

  if (!options.directory) {
    throw new Error('The `directory` option is required');
  }

  options.directory = path.resolve(electron.app.getAppPath(), options.directory);

  const handler = async (request: electron.ProtocolRequest, callback: (response: electron.ProtocolResponse | { error: number }) => void) => {
    const indexPath = path.join(options.directory!, 'index.html');
    const filePath = path.join(options.directory!, decodeURIComponent(new URL(request.url).pathname));
    const resolvedPath = await getPath(filePath);
    const fileExtension = path.extname(filePath);

    if (resolvedPath || !fileExtension || fileExtension === '.html' || fileExtension === '.asar') {
      callback({
        path: resolvedPath || indexPath
      });
    } else {
      callback({error: FILE_NOT_FOUND});
    }
  };

  electron.protocol.registerSchemesAsPrivileged([
    {
      scheme: options.scheme!,
      privileges: {
        standard: true,
        secure: true,
        allowServiceWorkers: true,
        supportFetchAPI: true,
        corsEnabled: options.isCorsEnabled
      }
    }
  ]);

  electron.app.on('ready', () => {
    const session = options.partition ?
      electron.session.fromPartition(options.partition) :
      electron.session.defaultSession;

    session.protocol.registerFileProtocol(options.scheme!, handler);
  });

  return async (window_: electron.BrowserWindow) => {
    await window_.loadURL(`${options.scheme!}://-`);
  };
};
