import { assumeRole } from "@/services/assumeRoleService";
import { launchInstance, listInstances, restartInstance, startInstance, stopInstance, terminateInstance } from "@/services/ec2Service/ec2InstanceService";
import { getErrorMessage } from "@/utils/errors";
import type { Instance } from "@aws-sdk/client-ec2";
import { EC2_API_Instance } from "@shared/ec2.type";
import { ipcMain } from "electron";

function parseInstanceList(instances: Instance[]): EC2_API_Instance[] {
  return instances.map((instance) => {
    const {
      InstanceId,
      InstanceType,
      State,
      Placement,
      PublicDnsName,
      PublicIpAddress,
      Monitoring,
      SecurityGroups = [],
      KeyName,
      LaunchTime,
      PlatformDetails,
      Operator,
      NetworkInterfaces = [],
      Tags = [],
    } = instance;

    return {
      Name: Tags.find((entry) => entry.Key === "Name")?.Value,
      InstanceId,
      InstanceState: State?.Name,
      InstanceType,
      AvailabilityZone: Placement?.AvailabilityZone,
      Dns: PublicDnsName,
      Ipv4: PublicIpAddress,
      Ipv6: NetworkInterfaces.flatMap((entry) => entry.Ipv6Addresses),
      Monitoring: Monitoring?.State,
      SecurityGroups: SecurityGroups.map((elem) => elem.GroupName),
      KeyName: KeyName,
      LaunchTime: LaunchTime?.toISOString(),
      Platform: PlatformDetails,
      Managed: Operator?.Managed,
    };
  });
}

function setupEC2Handler() {
  ipcMain.handle('ec2:list-instances', async () => {
    try {
      const credential = await assumeRole()
      const instances = await listInstances(credential)
      
      const parsedData = parseInstanceList(instances.filter((x): x is Instance => !!x))
      
      return { success: true, data: parsedData }
    } catch (error) {
      return { success: false, error: getErrorMessage(error) }
    }
  })

  ipcMain.handle('ec2:add-instance', async (_, { instanceName, instanceImage, instanceType }) => {
    try {
      const credential = await assumeRole()
      await launchInstance(credential, instanceName, instanceImage, instanceType)
      return { success: true, message: "Instance launched" }
    } catch (error) {
      return { success: false, error: getErrorMessage(error) }
    }
  })

  ipcMain.handle('ec2:delete-instance', async (_, instanceId: string) => {
    try {
      const credential = await assumeRole()
      await terminateInstance(credential, instanceId)
      return { success: true, message: "Instance deleting" }
    } catch (error) {
      return { success: false, error: getErrorMessage(error) }
    }
  }) 

  ipcMain.handle('ec2:stop-instance', async (_, instanceId: string) => {
    try {
      const credential = await assumeRole()
      await stopInstance(credential, instanceId)
      return { success: true, message: "Instance stopping" }
    } catch (error) {
      return { success: false, error: getErrorMessage(error) }
    }
  })

  ipcMain.handle('ec2:start-instance', async (_, instanceId: string) => {
    try {
      const credential = await assumeRole()
      await startInstance(credential, instanceId)
      return { success: true, message: "Instance starting" }
    } catch (err) {
      return { success: false, error: getErrorMessage(err) }
    }
  })

  ipcMain.handle('ec2:restart-instance', async (_, instanceId: string) => {
    try {
      const credential = await assumeRole()
      await restartInstance(credential, instanceId)
      return { success: true, message: "Instance restarting" }
    } catch (error) {
      return { success: false, error: getErrorMessage(error) }
    }
  })
}

export default setupEC2Handler;