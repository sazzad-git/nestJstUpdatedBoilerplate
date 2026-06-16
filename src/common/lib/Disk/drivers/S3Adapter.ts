import {
  S3Client,
  HeadObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { IStorage } from './iStorage';
import { DiskOption } from '../Option';

/**
 * S3Adapter for s3 bucket storage
 */
export class S3Adapter implements IStorage {
  private _config: DiskOption;
  private s3: S3Client;

  constructor(config: DiskOption) {
    this._config = config;
    const awsConfig: any = {
      endpoint: this._config.connection.awsEndpoint,
      region: this._config.connection.awsDefaultRegion,
      credentials: {
        accessKeyId: this._config.connection.awsAccessKeyId,
        secretAccessKey: this._config.connection.awsSecretAccessKey,
      },
    };
    if (this._config.connection.minio) {
      // forcePathStyle: true is the v3 equivalent of s3ForcePathStyle: true
      awsConfig.forcePathStyle = true;
    }
    this.s3 = new S3Client(awsConfig);
  }

  /**
   * returns object url
   *
   * https://[bucketname].s3.[region].amazonaws.com/[object]
   * and for minio
   * http://[endpoint]/[bucketname]/[object]
   * @param key
   * @returns
   */

  url(key: string): string {
    if (this._config.connection.minio) {
      return `${this._config.connection.awsEndpoint}/${this._config.connection.awsBucket}/${key}`;
    }
    return `https://${this._config.connection.awsBucket}.s3.${this._config.connection.awsDefaultRegion}.amazonaws.com/${key}`;
  }

  /**
   * check if file exists
   * @param key
   * @returns
   */
  async isExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this._config.connection.awsBucket,
        Key: key,
      });
      await this.s3.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * get data
   * @param key
   */
  async get(key: string) {
    try {
      const command = new GetObjectCommand({
        Bucket: this._config.connection.awsBucket,
        Key: key,
      });
      const response = await this.s3.send(command);
      return response.Body;
    } catch (error) {
      throw new Error(`Failed to get object ${key}: ${error}`);
    }
  }

  /**
   * put data
   * @param key
   * @param value
   */
  async put(
    key: string,
    value: Buffer | Uint8Array | string,
  ): Promise<any> {
    try {
      const command = new PutObjectCommand({
        Bucket: this._config.connection.awsBucket,
        Key: key,
        Body: value,
      });
      const response = await this.s3.send(command);
      return {
        ...response,
        Bucket: this._config.connection.awsBucket,
        Key: key,
        Location: this.url(key),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * delete data
   * @param key
   */
  async delete(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this._config.connection.awsBucket,
        Key: key,
      });
      await this.s3.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }
}

