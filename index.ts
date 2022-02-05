import ExtractImage from "./extractImage";

const SOU_PATH_KEY = "-sp";
const DES_PATH_KEY = "-dp";
const IS_DELETE_KEY = "-delete";
const IS_ABSOLUTE_KEY = "-ab";

function findArg(userArgs: string[], key: string, isBoolean?: boolean) {
  const index = userArgs.indexOf(key);
  return index !== -1 && userArgs[index + (isBoolean ? 0 : 1)];
}

async function main() {
  const userArgs = process.argv;
  const sourcePath = findArg(userArgs, SOU_PATH_KEY);
  const destinationPath = findArg(userArgs, DES_PATH_KEY);
  const isDelete = findArg(userArgs, IS_DELETE_KEY, true) ? true : false;
  const isAbsolute = findArg(userArgs, IS_ABSOLUTE_KEY, true) ? true : false;

  const logStr = `\nsource path : ${sourcePath}\ndestination path : ${destinationPath}\ndelete after : ${isDelete}\nabsolute path : ${isAbsolute}`;

  if (!sourcePath || !destinationPath) throw new Error(logStr);

  console.log(logStr);
  await new ExtractImage(
    sourcePath,
    destinationPath,
    isDelete,
    isAbsolute
  ).extractAndUnPack();
}

main();
