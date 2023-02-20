import { DefaultOverrides } from '@frugalwizard/abi2ts-lib';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { expect } from 'chai';
import { deployOrderbookScenarios } from './scenarios/deployOrderbook';

chai.use(chaiAsPromised);

DefaultOverrides.gasLimit = 5000000;

describe('deploy orderbook', () => {
    for (const scenario of deployOrderbookScenarios) {
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

                it('should deploy with the provided traded token', async (test) => {
                    const orderbook = await test.execute();
                    expect(await orderbook.tradedToken())
                        .to.be.equal(test.tradedToken.address);
                });

                it('should deploy with the provided base token', async (test) => {
                    const orderbook = await test.execute();
                    expect(await orderbook.baseToken())
                        .to.be.equal(test.baseToken.address);
                });

                it('should deploy with the provided contract size', async (test) => {
                    const orderbook = await test.execute();
                    expect(await orderbook.contractSize())
                        .to.be.equal(scenario.contractSize);
                });

                it('should deploy with the provided price tick', async (test) => {
                    const orderbook = await test.execute();
                    expect(await orderbook.priceTick())
                        .to.be.equal(scenario.priceTick);
                });

                it('should deploy with ask price at zero', async (test) => {
                    const orderbook = await test.execute();
                    expect(await orderbook.askPrice())
                        .to.be.equal(0n);
                });

                it('should deploy with bid price at zero', async (test) => {
                    const orderbook = await test.execute();
                    expect(await orderbook.askPrice())
                        .to.be.equal(0n);
                });
            }
        });
    }
});
