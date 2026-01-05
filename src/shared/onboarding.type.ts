type AppConfig =
  | {
      awsRegion: string;
      roleARN: string;
      tfStateBucket: string;
      tfRoleARN: string;
      isOnboarded: true;
    }
  | {
      isOnboarded: false;
    };

type AppSecrets = {
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
};

export type { AppConfig, AppSecrets };
