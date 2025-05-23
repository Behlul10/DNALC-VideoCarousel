using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Video;
using System.IO;

public class VideoPlayerHelper : MonoBehaviour
{
    [SerializeField] string videoFile;
    VideoPlayer videoPlayer;
    void Start()
    {
        videoPlayer = GetComponent<VideoPlayer>();
        if (videoPlayer == null ) { Debug.Log("No video player"); }
        PlayVideo();
    }

    // Update is called once per frame
    void Update()
    {
        
    }

    void PlayVideo()
    {
        if (videoPlayer != null) 
        {
            string videoPath = Path.Combine(Application.streamingAssetsPath, videoFile);
            Debug.Log(videoPath);
            videoPlayer.url = videoPath;
            videoPlayer.Play();
        }
    }
}
