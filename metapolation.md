**Me•ta•po•la•tion**: insert an intermediate font instance into a series by calculating it from surrounding known masters.

This page contains the interaction design research into metapolation and design explorations for handling it.

## the math
Luckily the math of metapolation is straightforward. When working with a design space set up by N masters (M1, M2, M3 .. M[N]), then the instance I is a linear combination of masters:

I = a·M1 + b·M2 + c·M3 .. n·M[N]

and the sum of all the factors (a, b, c .. n) equals 100%.

All points of all skeletons are calculated by this formula in the Cartesian plane.

_Example: 3-master metapolation, and a point has in the three masters the coordinates (x,y): (1,2), (2,3) and (3,2). Instance has metapolation 30% M1, 40% M2, 30% M3. Instance coordinate of the point:_<br>
_x = 30%·1 + 40%·2 + 30%·3 = 0.3 + 0.8 + 0.9 = 2_<br>
_y = 30%·2 + 40%·3 + 30%·2 = 0.6 + 1.2 + 0.6 = 2.4_<br>
_Instance coordinate is (2,2.4)_

All parameters are also calculated by the formula above.

_Example: 5-master metapolation, parameter weight for the five masters is 21, 32, 43, 98 and 62. Instance has metapolation 30% M1, 20% M2, 30% M3, 10% M4, 10% M5._<br>
_Instance weight = 30%·21 + 20%·32 + 30%·43 + 10%·98 + 10%·62 = 6.3 + 6.4 + 12.9 + 9.8 + 6.2 = 41.6_

### everything is connected
If we look at how many ratios can be defined between N masters, the number is the sum of 1 + 2 + 3 + .. + N-1, which is ½·N·(N-1).<br>
_Example: for a 4-master metapolation, there are 1 + 2 + 3 = 6 (= ½·4·3) ratios: M1 ↔ M2, M1 ↔ M3, M1 ↔ M4, M2 ↔ M3, M2 ↔ M4, M3 ↔ M4._

### conclusions from the math

The fist conclusion is that for an N-master metapolation only N-1 factors (think: input sliders) are needed; the final factor can be calculated from the 100% rule above. N-1 is the **minimum number** of inputs a metapolation needs. When a master is added to a metapolation, this number increases by 1.

The second conclusion is that for an N-master metapolation at most ½·N·(N-1) factors are needed; the relationship between each master to every other master is defined. ½·N·(N-1) is the **maximum number** of inputs a metapolation needs. When a master is added to an N-master metapolation, this number increases by N.

The conclusion from these conclusions is that the minimum number of inputs grows nice and linear with N _(7-master metapolation: 6 inputs)_, while the maximum number grows quadratic, which quickly adds up _(7-master metapolation: 21 inputs)_.

Although one could say that for simplicity sake striving for a minimum number of inputs is desirable, it can also be said that the maximum number of inputs is a true representation of the complexity of the design space.