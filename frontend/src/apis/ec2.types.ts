type EC2_API_Instance = {
  Name?: string;
  InstanceId?: string;
  InstanceState?: string; // Type of State?.Name (e.g., "running", "stopped")
  InstanceType?: string;
  AvailabilityZone?: string; // Type of Placement?.AvailabilityZone
  Dns?: string; // Type of PublicDnsName
  Ipv4?: string; // Type of PublicIpAddress
  Ipv6: Array<any>; // Array type depends on NetworkInterfaces[].Ipv6Addresses (likely Array<string> or Array<{Ipv6Address: string}>)
  Monitoring?: string; // Type of Monitoring?.State
  SecurityGroups: (string | undefined)[]; // Array of GroupName strings
  KeyName?: string;
  LaunchTime?: string; // Assuming LaunchTime is a Date object
  Platform?: string; // Type of PlatformDetails
  Managed?: boolean; // Type of Operator?.Managed
};

export type { EC2_API_Instance };
