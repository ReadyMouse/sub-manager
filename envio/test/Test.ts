import assert from "assert";
import { 
  TestHelpers,
  StableRentSubscription_OwnershipTransferred
} from "generated";
const { MockDb, StableRentSubscription } = TestHelpers;

describe("StableRentSubscription contract OwnershipTransferred event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for StableRentSubscription contract OwnershipTransferred event
  const event = StableRentSubscription.OwnershipTransferred.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("StableRentSubscription_OwnershipTransferred is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await StableRentSubscription.OwnershipTransferred.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualStableRentSubscriptionOwnershipTransferred = mockDbUpdated.entities.StableRentSubscription_OwnershipTransferred.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedStableRentSubscriptionOwnershipTransferred: StableRentSubscription_OwnershipTransferred = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      previousOwner: event.params.previousOwner,
      newOwner: event.params.newOwner,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualStableRentSubscriptionOwnershipTransferred, expectedStableRentSubscriptionOwnershipTransferred, "Actual StableRentSubscriptionOwnershipTransferred should be the same as the expectedStableRentSubscriptionOwnershipTransferred");
  });
});
