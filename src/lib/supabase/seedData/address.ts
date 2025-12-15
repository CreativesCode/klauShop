import { InsertOrderLines } from "../schema";
import db from "../db";
import * as schema from "../schema";

const address: schema.InsertAddress[] = [
  {
    name: "Casa",
    recipientName: "Hugo",
    phone: "+1234567890",
    zone: "Fremont",
    userProfileId: "02b6ecb6-f7a8-463f-9230-75c6cc48f492",
    fullAddress: "42412 Albrae Street, Fremont, CA 94538",
    isDefault: true,
    city: "Fremont",
    country: "US",
    line1: "42412 Albrae Street",
    line2: null,
    postal_code: "94538",
    state: "CA",
  },
  {
    name: "Trabajo",
    recipientName: "Hugo",
    phone: "+1234567890",
    zone: "Fremont",
    userProfileId: "02b6ecb6-f7a8-463f-9230-75c6cc48f492",
    fullAddress: "42412 Albrae Street, Fremont, CA 94538",
    isDefault: false,
    city: "Fremont",
    country: "US",
    line1: "42412 Albrae Street",
    line2: null,
    postal_code: "94538",
    state: "CA",
  },
];

const seedAddress = async () => {
  try {
    await db.delete(schema.address);

    const insertedOrders = await db
      .insert(schema.address)
      .values(address)
      .onConflictDoNothing()
      .returning();
    if (insertedOrders != null) console.log(`address are added to the DB.`);
  } catch (err) {
    console.log("Error happen while inserting address", err);
  }
};

export default seedAddress;
