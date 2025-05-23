using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Video;

public class ResizeVideo : MonoBehaviour
{
    [SerializeField] RawImage rawImage;
    [SerializeField] VideoPlayer videoPlayer;

    void Start()
    {
        videoPlayer.prepareCompleted += OnVideoPrepared;
        videoPlayer.Prepare();
    }

    void OnVideoPrepared(VideoPlayer vp)
    {
        float videoWidth = vp.texture.width;
        float videoHeight = vp.texture.height;

        RectTransform rt = rawImage.rectTransform;
        rt.sizeDelta = new Vector2(videoWidth, videoHeight);
    }
}
