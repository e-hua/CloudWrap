import { app } from 'electron';
import path from 'path';

const isDev = !app.isPackaged;

const templateDirPath = isDev
  ? path.join(app.getAppPath(), 'src', 'main', 'templates')
  : path.join(process.resourcesPath, 'templates');

export {templateDirPath}