import { readFileSync, writeFileSync } from "fs";
import { encodeAddress } from "@polkadot/util-crypto";
import { hexToString } from "@polkadot/util";

const main = () => {
  const dump = JSON.parse(
    readFileSync("./remarks-7678801-7874744-OEB-final.json", "utf8")
  );

  console.log(
    `dump size: ${dump.length}, call size: ${dump.reduce(
      (acc: any, cur: any) => acc + cur.calls.length,
      0
    )}`
  );

  const rmrkAddresses = new Set<string>();
  const uniqueAddresses = new Set<string>();

  let dupCount = 0;

  for (const block of dump) {
    for (const call of block.calls) {
      if (call.call !== "system.remark") {
        throw new Error(`invalid dump: ${call.call}`);
      }

      const [prefix, body] = hexToString(call.value).split("::");

      if (prefix !== "OEB") {
        throw new Error(`invalid prefix: ${prefix}`);
      }

      if ("RMRKAIRDROP" === body) {
        if (rmrkAddresses.has(call.caller)) {
          dupCount++;
          // console.log(`rmrk dup: ${call.caller}`);
        }
        rmrkAddresses.add(call.caller);
        continue;
      }
      if ("UNIQUEAIRDROP" === body) {
        if (uniqueAddresses.has(call.caller)) {
          dupCount++;
          // console.log(`unique dup: ${call.caller}`);
        }
        uniqueAddresses.add(call.caller);
        continue;
      }

      throw new Error(`unhandled body: ${body} (from: ${call.caller})`);
    }
  }

  console.log(
    `rmrk: ${rmrkAddresses.size}, unique: ${uniqueAddresses.size}, dup: ${dupCount}`
  );

  const rmrkAddressesArray = Array.from(rmrkAddresses);
  const uniqueAddressesArray = Array.from(uniqueAddresses);

  rmrkAddressesArray.sort();
  uniqueAddressesArray.sort();

  checkAddressFormats(rmrkAddressesArray);
  checkAddressFormats(uniqueAddressesArray);

  writeFileSync(
    "./rmrkAirdropClaimedAddresses.json",
    JSON.stringify(rmrkAddressesArray, null, 2)
  );
  writeFileSync(
    "./uniqueAirdropClaimedAddresses.json",
    JSON.stringify(uniqueAddressesArray, null, 2)
  );
};

const checkAddressFormats = (array: string[]) => {
  if (
    !checkArraysEquality(
      array,
      array.map((addr) => encodeAddress(addr, 2))
    )
  ) {
    throw new Error("invalid address format");
  }
};

const checkArraysEquality = <T>(a: T[], b: T[]) => {
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      console.error(`diff: ${a[i]}, ${b[i]}`);
      return false;
    }
  }
  return true;
};

main();
