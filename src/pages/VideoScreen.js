import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

const VideoScreen = () => {
  const { bookingId } = useParams();
  const jitsiContainerRef = useRef(null);

  useEffect(() => {
    const domain = 'meet.jit.si';
    const options = {
      roomName: `LoveTalkSession-${sessionId}`,
      width: '100%',
      height: 700,
      parentNode: jitsiContainerRef.current,
      userInfo: {
        displayName: "User", // Replace with actual user name if needed
      },
    };

    const api = new window.JitsiMeetExternalAPI(domain, options);

    return () => api.dispose(); // Clean up
  }, [sessionId]);

  return (
    <div className="container my-5">
      <h3 className="mb-3">Video Call for Session #{sessionId}</h3>
      <div ref={jitsiContainerRef} />
    </div>
  );
};

export default VideoScreen;

