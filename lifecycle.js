const child_process = require("child_process");
const fs = require("fs");
const sleep = require("util").promisify(setTimeout);

const containerID = 101;
const containerPort = 10000;
const containerIP = "172.20.0.123";
const scrambleLevel = "all";

const createContainer = () => {
  console.log("CREATING CONTAINER");
  const createCommand =
    "pct create " +
    containerID +
    " local:vztmpl/ubuntu-16.04-standard_16.04.5-1_amd64.tar.gz --storage local-lvm --net0 name=eth0,bridge=vmbr0,ip=172.20.0.123/16,gw=172.20.0.1 --cores 1 --memory 4096 --swap 0";

  let creationResponse = child_process.spawnSync(createCommand);

  if (creationResponse.error) {
    console.log(creationResponse.error);
    return false;
  }

  return true;
};

const mountContainer = () => {
  console.log("MOUNTING CONTAINER");
  const mountCommand = "pct mount " + containerID;

  let mountResponse = child_process.spawnSync(mountCommand);

  if (mountResponse.error) {
    console.log(mountResponse.error);
    return false;
  }

  return true;
};

const execMITM = () => {
  console.log("EXECUTING MAN IN THE MIDDLE");
  let scrambleScript;
  if (scrambleLevel === "all") {
    scrambleScript = "scramble_all.js";
  } else if (scrambleLevel === "half") {
    scrambleScript = "scramble_half.js";
  } else if ((scrambleLevel = "impossible")) {
    scrambleScript = "impossible.js";
  } else {
    scrambleScript = "control.js";
  }

  const mitmCommand =
    "node mitm/index.js HACS202_B " +
    containerPort +
    " " +
    containerIP +
    " " +
    containerID +
    " true " +
    scrambleScript;

  let mitmResponse = child_process.spawnSync(mitmCommand);

  if (mitmResponse.error) {
    console.log(mitmResponse.error);
    return false;
  }

  return true;
};

const scanLoginsFile = async () => {
  console.log("SCANNING LOGINS FILE");
  const loginsPath = "~/MITM_data/logins " + containerID + ".txt";

  let loginsFileBuffer = fs.readFileSync(loginsPath);
  const previousBufferSize = loginsFileBuffer.byteLength;
  let newBufferSize = -1;

  while (newBufferSize != previousBufferSize) {
    loginsFileBuffer = fs.readFileSync(loginsPath);
    newBufferSize = loginsFileBuffer.byteLength;

    await sleep(5000);
  }

  return true;
};

const waitForAttacker = async () => {
  console.log("WAITING FOR ATTACKER TO FINISH");
  await sleep(1000 * 60 * 30);
};

const destroyContainer = () => {
  console.log("DESTROYING CONTAINER");
  const stopCommand = "pct stop " + containerID;
  const destroyCommand = "pct destroy " + containerID;

  const stopResponse = child_process.spawnSync(stopCommand);
  if (stopResponse.error) {
    return false;
  }

  const destroyResponse = child_process.spawnSync(destroyCommand);
  if (destroyResponse.error) {
    console.log(destroyResponse.error);
    return false;
  }
};

const doLifecycle = () => {
  console.log("STARTING LIFECYCLE");
  let cont = true;
  while (cont) {
    cont = createContainer();
    cont = mountContainer();
    cont = execMITM();
    cont = scanLoginsFile();
    cont = waitForAttacker();
    cont = destroyContainer();
  }
};

doLifecycle();
