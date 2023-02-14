import { DefaultOverrides } from '@frugal-wizard/abi2ts-lib';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { expect } from 'chai';
import { deployOrderbookFactoryScenarios } from './scenarios/deployFactory';

chai.use(chaiAsPromised);

DefaultOverrides.gasLimit = 5000000;

describe('deploy factory', () => {
    for (const scenario of deployOrderbookFactoryScenarios) {
        scenario.describe(({ it }) => {
            if (scenario.expectedError) {
                it('should fail', async (test) => {
                    await expect(test.execute())
                        .to.be.rejected;
                });

                it(`should fail with ${scenario.expectedError.name}`, async (test) => {
                    await expect(test.executeStatic())
                        .to.be.rejected.and.eventually.be.deep.equal(scenario.expectedError);
                });

            } else {
                it('should deploy with the provided treasury contract', async (test) => {
                    const orderbook = await test.execute();
                    expect(await orderbook.treasury())
                        .to.be.equal(test.treasury.address);
                });

                it('should deploy with the provided address book contract', async (test) => {
                    const orderbook = await test.execute();
                    expect(await orderbook.addressBook())
                        .to.be.equal(test.addressBook.address);
                });

                it('should deploy with total created orderbooks at zero', async (test) => {
                    const orderbook = await test.execute();
                    expect(await orderbook.totalCreated())
                        .to.be.equal(0n);
                });
            }
        });
    }
});

