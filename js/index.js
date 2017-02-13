/*rem*/

~function () {
    var winW = document.documentElement.clientWidth,
        desW = 640,
        htmlFont = winW / desW * 100;
    //->当屏幕的宽度大于设计稿的宽度，让音乐区域最大640px即可.也可以在css中：max-width:640px
    if (winW >= 640) {
        $('.musicBox').css({
            width: desW,
            margin: '0 auto'
        });
        window.htmlFont = 100;
        return;
    }
    window.htmlFont = htmlFont;
    document.documentElement.style.fontSize = htmlFont + 'px';
}();

~function () {
    var winH = document.documentElement.clientHeight,
        headerH = $('.header')[0].offsetHeight,
        footerH = $('.footer')[0].offsetHeight;
    $('.main').css('height', winH - headerH - footerH - .8 * htmlFont);
}();

var musicRender = (function () {

    var $musicPlan = $.Callbacks(),
        $current = $('.current'),
        $duration = $('.duration'),
        $timeLineSpan = $('.timeLine>span'),
        $lyric = $('.lyric');
    var musicAudio = $('#musicAudio')[0],
        $musicBtn = $('.musicBtn'),
        $musicBtnPlay = $musicBtn.eq(0),
        $musicBtnPause = $musicBtn.eq(1);
    //eq是获取贪杯中的某一个但是获取的结果依然是jq对象，而[n](.get(n))获取的虽然也是某一个时候是结果是js对象

    var musicTimer = null,
        step = 0;//记录当前展示到哪一句话了，1代表展示第一行了

    function formatTime(second) {
        var minute = Math.floor(second / 60),
            second = Math.floor(second - minute * 60);
        minute < 10 ? minute = '0' + minute : null;
        second < 10 ? second = '0' + second : null;
        return minute + ':' + second;
    }

    $musicPlan.add(function (data) {
        var str = '';
        $.each(data, function (index, item) {
            str += `<p data-minute="${item.minute}" data-second="${item.second}" id="lyric${item.id}">${item.content}</p>`;
        });
        $lyric.html(str);
    });
    //控制音频的自动播放
    $musicPlan.add(function () {
        musicAudio.play();
        musicAudio.addEventListener('canplay', function () {
            $duration.html(formatTime(musicAudio.duration));
            $musicBtnPlay.css('display', 'none');
            $musicBtnPause.css('display', 'block');
        })
    });

    //控制播放和暂停
    $musicPlan.add(function () {
        //移动端可以使用click事件，但是在移动端click代表单击操作，所以在每一次触发完成后都会等待300ms才能判断是否为单击
        $musicBtn.tap(function () {
            if (musicAudio.paused) {//暂停
                musicAudio.play();
                $musicBtnPlay.css('display', 'none');
                $musicBtnPause.css('display', 'block');

            }else{
                console.log(1);
                musicAudio.pause();
                $musicBtnPlay.css('display', 'block');
                $musicBtnPause.css('display', 'none');
            }


        });
    });

    $musicPlan.add(function () {
        musicTimer = window.setInterval(function () {
            if (musicAudio.currentTime >= musicAudio.duration) {
                window.clearInterval(musicTimer);
            }

            var timeR = formatTime(musicAudio.currentTime),
                minute = timeR.split(':')[0],
                second = timeR.split(':')[1];
            //获取当前已经播放的时间 musicAudio.currentTime .控制显示当前播放时间，而且还需要控制进度条的改变
            $current.html(formatTime(musicAudio.currentTime));
            $timeLineSpan.css('width', (musicAudio.currentTime / musicAudio.duration) * 100 + '%');

            //控制歌词对应：先控制对应的行有选中的样式：知道当前播放时间对应的分钟和秒
            var $lyricList = $lyric.children('p');
            $tar = $lyricList.filter('[data-minute="' + minute + '"]').filter('[data-second="' + second + '"]');
            $tar.addClass('bg').siblings().removeClass('bg');
            var n = $tar.index();
            if (n > 3) {//已经播放到第四条：这一条是歌词了，我们开始向上移动 .84rem
                $lyric.css({
                    top: -.84 * (n - 2) + 'rem',

                });

            }


        }, 1000);
    });

    return {
        init: function () {
            $.ajax({
                url: 'lyric.json',
                type: 'get',
                dataType: 'json',
                cache: false,
                success: function (result) {
                    if (result) {
                        result = result.lyric || '';
                        result = result.replace(/&#(\d+);/g, function () {
                            var num = Number(arguments[1]),
                                val = arguments[0];
                            switch (num) {
                                case 32:
                                    val = '';
                                    break;
                                case 40:
                                    val = '(';
                                    break;
                                case 41:
                                    val = ')';
                                    break;
                                case 45:
                                    val = '-';
                                    break;
                            }

                            return val;
                        });
                        var data = [],
                            index = 0,
                            reg = /\[(\d{2})&#58;(\d{2})&#46;(?:\d{2})\]([^&#]+)(?:&#10;)?/g;
                        result.replace(reg, function () {
                            data.push({
                                id: ++index,
                                minute: arguments[1],
                                second: arguments[2],
                                content: arguments[3]
                            });
                        });
                        $musicPlan.fire(data);
                    }
                }
            });
        }
    }
})();
musicRender.init();
