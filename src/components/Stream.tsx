import { useEffect, useRef, useState } from "react";
import { Peer } from "peerjs";
import { handleUserStateEvent } from "../utils/utils";
import { peerAtom } from "../state/state";
import { useAtom } from "jotai";

const peer1 = new Peer("some string");

const connctedPeers: string[] = [];

const user = prompt("enter username please");

declare global {
  interface Window {
    localStream: MediaStream | null;
  }
}

window.localStream = null;

window.localStream = null;

let peer: typeof peer1;

const config = {
  iceServers: [
    { url: "stun:stun.l.google.com:19302" },
    { url: "stun:stun4.l.google.com:19302" },
  ],
};

type MessageType = {
  type: "peers";
  connctedPeers: Array<string>;
};

const connect = (
  updateLocalUserId: (id: string) => void,
  updateRemoteStream: (stream: MediaStream, userId: string) => void,
  handleUserDisconnect: (uid: string) => void,
  SetAtom: (peer: Peer) => void
) => {
  peer = new Peer(user!, {
    host: "localhost",
    port: 8000,
    path: "/peerjs/myapp",

    config,
  });

  SetAtom(peer);

  peer.on("open", (id) => {
    updateLocalUserId(id);
  });

  peer.on("connection", (conn) => {
    const id = conn.peer;
    connctedPeers.push(conn.peer);

    conn.on("data", (data) => {
      console.log(data);
    });

    conn.on("open", () => {
      conn.send({ type: "peers", connctedPeers });
    });

    handleUserStateEvent(conn, { id, onDisconnct: handleUserDisconnect });
  });

  peer.on("error", (err) => {
    console.error(err);
  });
  peer.on("call", async (conn) => {
    console.log("incomming call");
    window.localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    if (conn.metadata.config.shouldAskPrompt) {
      const accceptCall = confirm(
        "Incomming video Call do you want to accept ?"
      );
      if (!accceptCall) return;
      conn.answer(window.localStream!);
    } else {
      conn.answer(window.localStream!);
    }

    conn.on("stream", (stream) => {
      updateRemoteStream(stream, conn.metadata.name);
    });
  });
  peer.on("disconnected", (id) => {
    handleUserDisconnect(id);
  });
};

function connectToRemote(
  remoteId: string,
  updateRemoteStream: (stream: MediaStream, userId: string) => void,
  setIsJoined: (joinded: boolean) => void,
  localUserId: string,
  handleUserDisconnect: (uid: string) => void
) {
  if (peer) {
    const conn = peer.connect(remoteId);
    handleUserStateEvent(conn, {
      id: remoteId,
      onDisconnct: handleUserDisconnect,
    });
    setIsJoined(true);
    conn?.on("open", () => {
      conn.on("data", (data) => {
        const message = data as MessageType;
        if (message.type === "peers") {
          console.log(message.type);
          const filterMine = message.connctedPeers.filter(
            (peer) => peer !== localUserId
          );
          console.log("filerMine", filterMine);
          if (filterMine.length) {
            filterMine.forEach((user) => {
              const conn = peer.connect(user);

              if (window.localStream) {
                setTimeout(() => {
                  const mConn = peer.call(user, window.localStream!, {
                    metadata: {
                      name: localUserId,
                      config: { shouldAskPrompt: false },
                    },
                  });
                  mConn.on("stream", (stream) => {
                    updateRemoteStream(stream, user);
                  });
                }, 2000);
              }
              handleUserStateEvent(conn, {
                id: user,
                onDisconnct: handleUserDisconnect,
              });
            });
          }
        }
      });
      conn.send("hey user");
    });

    setTimeout(() => {
      if (conn && conn.open) {
        console.log("starting call");
        navigator.mediaDevices
          .getUserMedia({ audio: true, video: true })
          .then((res) => {
            window.localStream = res;
            const conn = peer.call(remoteId, res, {
              metadata: {
                name: localUserId,
                config: { shouldAskPrompt: true },
              },
            });
            conn.on("stream", (stream) => {
              updateRemoteStream(stream, remoteId);
            });
          });
      }
    }, 1000);
  }
}

function Stream() {
  const [, setPeer] = useAtom(peerAtom);

  const [localStream, setLocalStream] = useState<MediaStream>();
  const [localUserId, setLocalUserId] = useState("");

  const [remoteStreams, setRemoteStreams] = useState<
    { userId: string; stream: MediaStream }[]
  >([]);

  const [joined, setIsJoined] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUserDisconnect = (uid: string) =>
    setRemoteStreams((prv) => prv.filter(({ userId }) => userId !== uid));

  function updateRemoteStream(stream: MediaStream, userId: string) {
    if (!stream) return;
    setRemoteStreams((prv) => {
      if (prv.length) {
        return prv
          .filter(({ stream: strm }) => strm.id !== stream.id)
          .concat([{ userId, stream }]);
      }
      return [{ userId, stream }];
    });
  }

  const updateLocalUserId = (id: string) => {
    setLocalUserId(id);
  };

  useEffect(() => {
    if (!localUserId) {
      connect(
        updateLocalUserId,
        updateRemoteStream,
        handleUserDisconnect,
        setPeer
      );
    }
    if (localUserId) {
      try {
        (async () => {
          const res = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
          });
          console.log(res);
          setLocalStream(res);
          window.localStream = res;
        })();
      } catch (err) {
        console.error(err);
      }
    }
  }, [localUserId]);

  useEffect(() => {
    return () => {
      peer && peer.disconnect();
    };
  }, []);

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log("form handled");
    const value = inputRef.current?.value;
    if (!value) return;
    connectToRemote(
      value,
      updateRemoteStream,
      setIsJoined,
      localUserId,
      handleUserDisconnect
    );
  }

  // console.log(localStream)

  return (
    <>
      <div>your id is {localUserId ? localUserId : null}</div>
      <div>
        {localStream ? (
          <>
            <Video stream={localStream} />
            <div>you</div>
          </>
        ) : null}
      </div>

      <div className="flex justify-center items-center flex-wrap gap-4">
        {remoteStreams?.map((v) => {
          return (
            <div className="min-w-[300px] shadow-lg rounded-md bg-slate-600">
              <Video stream={v.stream} />
              <div>{v.userId}</div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-center items-center h-screen w-screen flex-col">
        {!joined ? (
          <>
            {" "}
            <form
              className="flex justify-center flex-col"
              onSubmit={handleFormSubmit}>
              <div>
                <input
                  ref={inputRef}
                  className="border border-black p-2 rounded-md text-black"
                  type="text"
                />
              </div>
              <div className="flex justify-center items-center mx-2">
                <button className="bg-green-600 rounded-md p-2 m-2 text-white">
                  join live
                </button>
                <button className="bg-green-600 rounded-md p-2 m-2 text-white">
                  create
                </button>
              </div>
            </form>{" "}
          </>
        ) : null}
      </div>
    </>
  );
}

const Video = ({ stream }: { stream: MediaStream }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      className="w-96 h-80"
      ref={videoRef}
      autoPlay
      controls
      controlsList="nofullscreen"
    />
  );
};

export default Stream;
