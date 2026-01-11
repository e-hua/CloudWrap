import { StreamData } from "@/services/deploymentService/runTofu";
import { getGithubConnectionStatus } from "@/services/onboardingService/githubConnectionService";
import { startOnboarding } from "@/services/onboardingService/onboardingService";
import { ConfigManager } from "@/utils/ConfigManager";
import { getErrorMessage } from "@/utils/errors";
import { ipcMain } from "electron";

function setupOnboardingHandler() {
  const activeChannels = new Map<string, Promise<void>>();

  ipcMain.handle("onboarding:start", async (event, { accessKey, secretKey, region }) => {
    const channel = `onboarding-internal:start`;

    if (activeChannels.has(channel)) {
      console.log(`Channel ${activeChannels} is already in progress.`);
      console.log("Onboarding is already in progress.");

      const createdChannelFinishedSignalPromise = activeChannels.get(channel);
      await createdChannelFinishedSignalPromise;
      return;
    }

    const {
      resolve: resolveChannelFinishedSignalPromise,
      promise: channelFinishedSignalPromise,
      reject: rejectChannelFinishedSignalPromise
    } = Promise.withResolvers<void>();
    activeChannels.set(channel, channelFinishedSignalPromise);

    const logCallback = (elem: StreamData) => {
      console.log(elem.data);
      event.sender.send(channel, elem);
    };

    try {
      logCallback({
        source: "sys-info",
        data: "IAM roles and OpenTofu state buckets creation started!"
      });
      // service functions calls
      await startOnboarding({ accessKey, secretKey, region, onLog: logCallback });
      logCallback({
        source: "sys-info",
        data: "IAM roles and OpenTofu state buckets created successfully!"
      });
      event.sender.send(channel, { end: true });
      resolveChannelFinishedSignalPromise();
    } catch (err) {
      console.error(err);
      event.sender.send(channel, { source: "sys-failure", data: getErrorMessage(err), end: true });
      rejectChannelFinishedSignalPromise(err);
      throw err;
    } finally {
      activeChannels.delete(channel);
    }
  });

  ipcMain.handle("onboarding:configs", async () => {
    try {
      const configs = ConfigManager.getConfig();
      return { success: true, data: configs };
    } catch (err) {
      return { success: false, error: getErrorMessage(err) };
    }
  });

  ipcMain.handle("onboarding:reset", async () => {
    try {
      const configs = await ConfigManager.clear();
      return { success: true, data: configs };
    } catch (err) {
      return { success: false, error: getErrorMessage(err) };
    }
  });

  ipcMain.handle("onboarding:github-connection", async (_, connectionArn: string) => {
    try {
      const data = await getGithubConnectionStatus(connectionArn);
      return { success: true, data };
    } catch (err) {
      return { success: false, error: getErrorMessage(err) };
    }
  });
}

export default setupOnboardingHandler;
