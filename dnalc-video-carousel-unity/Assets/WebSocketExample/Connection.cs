using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

using NativeWebSocket;
using UnityEditor.VersionControl;

[Serializable]
public class SlideMessage
{
  public HandData rightHand;
  public string slideState;
  public long timestamp;
}

[Serializable]
public class HandData
{
  public bool isClosed;
  public float x;
  public float y;
}



public class Connection : MonoBehaviour
{
    WebSocket websocket;

    // store the last‐received message here:
    [HideInInspector]
    public SlideMessage currentMsg;


    async void Start()
    {
        // websocket = new WebSocket("ws://echo.websocket.org");
        //websocket = new WebSocket("ws://172.20.10.1");

        //websocket = new WebSocket("ws://172.20.10.13:8080");  /////
        websocket = new WebSocket("ws://localhost:8080");

        websocket.OnOpen += () => { Debug.Log("Connection open!"); };
        websocket.OnError += (e) => { Debug.Log("Error! " + e);};
        websocket.OnClose += (e) => { Debug.Log("Connection closed!");};

        websocket.OnMessage += (bytes) =>
        {
            // Reading a plain text message
            //var message = System.Text.Encoding.UTF8.GetString(bytes);
            //Debug.Log("Received OnMessage! (" + bytes.Length + " bytes) " + message);
            var json = System.Text.Encoding.UTF8.GetString(bytes);
            Debug.Log("RAW JSON from server: " + json);

            // parse & store in the public field:
            currentMsg = JsonUtility.FromJson<SlideMessage>(json);
            Debug.Log("Received slideState=" + currentMsg.slideState);
            /*
            // parse to your C# type
            SlideMessage msg = JsonUtility.FromJson<SlideMessage>(json);

            // now you can read slideState
            if (msg.slideState == "next" || msg.slideState == "previous")
            {
                Debug.Log("Received OnMessage!" + msg.slideState);
            }*/

        };
        //message slidestate: "next", "previous", "null"
        // Keep sending messages at every 0.3s
        //InvokeRepeating("SendWebSocketMessage", 0.0f, 0.3f);

        await websocket.Connect();
  }
    void Update()
    {
        #if !UNITY_WEBGL || UNITY_EDITOR
        websocket.DispatchMessageQueue();
        #endif
    }

    async void SendWebSocketMessage()
    {
        if (websocket.State == WebSocketState.Open)
        {
            // Sending bytes
            await websocket.Send(new byte[] { 10, 20, 30 });
            // Sending plain text
            await websocket.SendText("plain text message");
        }
    }
    private async void OnApplicationQuit()
    {
        await websocket.Close();
    }
}
