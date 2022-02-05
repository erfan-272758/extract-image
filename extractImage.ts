import * as extract from "extract-zip";
import * as fs from "fs/promises";
// import { join } from "path";

function join(...paths: string[]) {
  return paths.join("/").replace(new RegExp("(//|///)", "g"), "/");
}

function findFileName(str: string, deleteFormat?: boolean) {
  const nameWithFormat = join("/", str).split("/").pop() || "";
  return deleteFormat ? nameWithFormat.split(".")[0] : nameWithFormat;
}

export default class ExtractImage {
  constructor(
    private zipPath: string,
    private desPath: string,
    private isDeleteAfter?: boolean,
    private isAbsolute?: boolean
  ) {}

  private async findZipFiles() {
    const fns = await fs.readdir(this.zipPath);
    return fns
      .filter((fn) => /(.zip|.rar)/.test(fn))
      .map((fn) => join(this.zipPath, fn));
  }

  private async extractZipFiles(fns: string[]) {
    for (const fn of fns) {
      const sou = this.isAbsolute ? fn : join(__dirname, fn);
      const des = this.isAbsolute
        ? this.zipPath
        : join(__dirname, this.zipPath);
      await (extract as any)(sou, {
        dir: des,
      });
      this.isDeleteAfter && (await fs.unlink(sou));
    }
  }

  private async isDirectory(path: string) {
    return (await fs.lstat(path)).isDirectory() ? path : false;
  }

  private async isEmpty(path: string) {
    return (await fs.readdir(path)).length === 0;
  }

  private async findFolders(zipFiles: string[]) {
    const allowedNames = zipFiles.map((fn) => findFileName(fn, true));
    return (
      await Promise.all(
        (
          await fs.readdir(this.zipPath)
        )
          .filter((fn) => allowedNames.includes(fn))
          .map((fn) => join(this.zipPath, fn))
          .map(this.isDirectory)
      )
    ).filter((s) => typeof s === "string") as string[];
  }

  private async findImage(folderPath: string) {
    return (await fs.readdir(folderPath))
      .filter((fn) => /(.webp|.jpg|.png|.gif|.ico)/.test(fn))
      .map((fn) => join(folderPath, fn));
  }

  private async findSouImages(fps: string[]) {
    return (await Promise.all(fps.map((fln) => this.findImage(fln)))).flat();
  }

  private findDesImages(imageSource: string[]) {
    return imageSource.map((is) => join(this.desPath, findFileName(is)));
  }

  private deleteEmptyFolders(folders: string[]) {
    return Promise.all(
      folders.map(async (f) => {
        (await this.isEmpty(f)) && (await fs.rmdir(f));
      })
    );
  }

  private async unpackedZipFiles(zipFiles: string[]) {
    const folders = await this.findFolders(zipFiles);
    const imageSource = await this.findSouImages(folders);
    const imageDes = this.findDesImages(imageSource);
    await Promise.all(
      imageSource.map(async (sou, i) => {
        const des = imageDes[i];
        await fs.rename(sou, des);
      })
    );

    return folders;
  }

  public async extractAndUnPack() {
    console.log("start extract and unpacking...");
    const zfns = await this.findZipFiles();
    console.log(zfns.length, "zip files detected.");
    await this.extractZipFiles(zfns);
    console.log("all zip files extracted.");
    const folders = await this.unpackedZipFiles(zfns);
    console.log("successfully unpacked.");
    await this.deleteEmptyFolders(folders);
    console.log("successfully delete empty folders.");
    console.log("end.");
  }
}
