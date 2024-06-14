import { AnalysisService } from "./services/analysis.service";

const main = async () => {
  const data = await AnalysisService.checkFile(
    "C:\\Users\\Student\\Downloads\\xxstrings64.exe"
  );
  console.log(data);
};

main();
