
package com.example;

import com.guidewire.rating.sdk.AbstractRateBook;
import com.guidewire.rating.sdk.RateResult;
import com.guidewire.rating.sdk.data.Cost;
import com.guidewire.rating.sdk.data.variable.VariableMap;
import com.guidewire.rating.sdk.data.variable.WritableVariableMap;
import org.apache.commons.lang3.tuple.Pair;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class Hello extends AbstractRateBook {
    @Override
    public List<Cost> doExecute(VariableMap parameters) {
        List<Cost> costs = new ArrayList<>();

        // Retrieve All Coverages
        RateResult<List<Pair<String, String>>> allCoverages = getRatingVariable("AllCoveragesRatingVariable",
            parameters);


        // Calculate Cost for each coverage
        allCoverages.getValue().forEach(coverage -> {
            WritableVariableMap costRoutineParameters = WritableVariableMap.of(
                "coverage", coverage.getLeft(),
                "coverageInstanceId", coverage.getRight());


            RateResult<Cost> covCostRateResult = executeCostRoutine("CostRoutine", costRoutineParameters);

            Optional.ofNullable(covCostRateResult.getValue())
                .ifPresent(costs::add);
        });

        return costs;
    }
}
