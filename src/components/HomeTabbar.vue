<template>
  <div
    class="bar box flex a-center j-between shadow"
    :class=" isIpx ? 'fix-iphonex-icon' : '' "
  >
    <form
      report-submit="true"
      @submit="home"
    >
      <button
        class="flex center"
        form-type="submit"
        hover-class="active"
      >
        <image
          v-show="tab == 'home'"
          class="icon"
          src="/static/png/data.png"
        />
        <image
          v-show="tab != 'home'"
          class="icon"
          src="/static/png/data.png"
        />
      </button>
      <span class="flex center">数据检测</span>
    </form>
    <form
      report-submit="true"
      @submit="mail"
    >
      <button
        :class="mailCount ? 'leftMail' : '' "
        class="flex center mailBtn"
        form-type="submit"
        hover-class="active"
      >
        <image
          v-show="tab == 'mail'"
          class="icon mail"
          src="/static/png/device.png"
        />
        <image
          v-show="tab != 'mail'"
          class="icon mail"
          src="/static/png/device.png"
        />
        <div
          v-if="mailCount"
          class="flex center"
          :class="mailCount > 10 ? 'mailCountTwo' : 'mailCountOne' "
        >
          {{ mailCount }}
        </div>
      </button>
      <span class="flex center">设备检测</span>
    </form>
    <form
      report-submit="true"
      @submit="myInfo"
    >
      <button
        class="flex center"
        form-type="submit"
        hover-class="active"
      >
        <image
          v-show="tab == 'mine'"
          class="icon"
          src="/static/png/fire.png"
        />
        <image
          v-show="tab != 'mine'"
          class="icon"
          src="/static/png/fire.png"
        />
      </button>
      <span class="flex center">消防检测</span>
    </form>
    <form
      report-submit="true"
      @submit="myInfo"
    >
      <button
        class="flex center"
        form-type="submit"
        hover-class="active"
      >
        <image
          v-show="tab == 'mine'"
          class="icon"
          src="/static/png/mine.png"
        />
        <image
          v-show="tab != 'mine'"
          class="icon"
          src="/static/png/mine.png"
        />
      </button>
      <span class="flex center">个人中心</span>
    </form>
  </div>
</template>

<script>
export default {
  name: "TtabBar",
  props: {
    active: {
      type: String,
      default: "home"
    },
    mailCount: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      tab: "home" ,
      isIpx: false
    };
  },
  created() {
    this.tab = this.active;
    const model = wx.getSystemInfoSync().model;
    if(model.match("iPhone X")){
      this.isIpx = true;
    }
  },
  methods: {
    myInfo(e) {
      wx.reLaunch({
      url: "/pages/info/index"
      });
    },
    home(e) {
      wx.reLaunch({
            url: "/pages/home/index"
          });
    },
    mail(e) {
      wx.reLaunch({
            url: "/pages/home/index"
      });
    }
  }
};
</script>

<style lang="less" scoped>
.bar {
  flex-shrink: 0;
  height: 124rpx;
  width: 100%;
  color: #2a2a2a;
  background: #ffffff;
  padding: 32rpx 86rpx;
  .icon {
    width: 60rpx;
    height: 60rpx;
    position: relative;
  }
  .active {
    background: #ffffff;
  }
}
.fix-iphonex-icon {
  height: 142rpx;
  padding:32rpx 86rpx 80rpx;
}
.mailBtn {
  overflow: visible;
}
.mailCountOne{
  width:32rpx;
  height: 32rpx;
  border-radius: 16px;
  background-color: #1AAD19;
  color: #ffffff;
  position:absolute;
  left:85rpx;
  top:-10rpx;
  font-size: 22rpx;
}
.mailCountTwo{
  width:44rpx;
  height: 32rpx;
  border-radius: 16px;
  background-color: #1AAD19;
  color: #ffffff;
  position: absolute;
  left:85rpx;
  top:-10rpx;
  font-size: 22rpx;
}
</style>
