import { StreamData } from "@/services/deploymentService/runTofu";
import { startOnboarding } from "@/services/onboardingService/onboardingService";
import { getErrorMessage } from "@/utils/errors";
import { ipcMain } from "electron";

function setupOnboardingHandler() {
  const activeChannels = new Set<string>();

  ipcMain.handle('onboarding:start', async (event, {accessKey, secretKey, region}) => {
    const channel = `onboarding-internal:start`; 

    if (activeChannels.has(channel)) {
      console.log(`Channel ${activeChannels} is already in progress.`);
      throw new Error("Onboarding is already in progress.");
    }
    activeChannels.add(channel)
    
    const logCallback = (elem: StreamData) => {
      console.log(elem.data);
      event.sender.send(channel, elem)
    };

    try {
      logCallback({ source: 'sys-info', data: 'IAM roles and OpenTofu state buckets creation started!'});
      // service functions calls
      await startOnboarding({accessKey, secretKey, region, onLog: logCallback}) 
      logCallback({ source: 'sys-info', data: 'IAM roles and OpenTofu state buckets created successfully!'});
      event.sender.send(channel, { end: true})
    } catch (err) {
      console.error(err);
      event.sender.send(channel, { source: 'sys-failure', data: getErrorMessage(err), end: true});
      throw err
    } finally {
      activeChannels.delete(channel)
    }
  });

}

export default setupOnboardingHandler;