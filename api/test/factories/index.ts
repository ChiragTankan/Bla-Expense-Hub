import { DataSource } from 'typeorm';
// import { UserFactory } from './user.factory';

// export * from './user.factory';

export class FactoryManager {
  //   public readonly user: UserFactory;

  constructor(dataSource: DataSource) {
    // this.user = new UserFactory(dataSource);
    console.log(
      'FactoryManager initialized with DataSource:',
      dataSource.options,
    );
  }
}
